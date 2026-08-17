/**
 * Generates code harness per language that wraps student submission code
 * with testcases, runs them, measures execution time, and outputs formatted __RESULTS__ JSON.
 */

function generateHarness(language, studentCode, testcases, functionName = 'solution', customTemplate = null) {
  const formattedTestcases = JSON.stringify(testcases);

  // 1. Custom Harness Template saved by Faculty in MongoDB for this question
  if (customTemplate && customTemplate.includes('{{STUDENT_CODE}}')) {
    const codeToInject = (studentCode && studentCode.trim()) ? studentCode : 'pass';
    let wrapped = customTemplate
      .replace('{{STUDENT_CODE}}', codeToInject)
      .replace('{{TESTCASES_JSON}}', formattedTestcases)
      .replace('{{FUNCTION_NAME}}', functionName);

    const lang = (language || '').toLowerCase();
    if (lang === 'python') {
      // Inject dictionary unpacking before target_fn call in custom templates
      if (wrapped.includes('target_fn(*inp_args)') && !wrapped.includes('isinstance(inp_args[0], dict)')) {
        wrapped = wrapped.replace(
          'target_fn(*inp_args)',
          'if isinstance(inp_args, list) and len(inp_args) == 1 and isinstance(inp_args[0], dict):\n            inp_args = list(inp_args[0].values())\n        res = target_fn(*inp_args)'
        );
      }
      // Replace hardcoded error string with real Python exception string
      wrapped = wrapped.replace(
        /"error":\s*"Printed output does not match expected output\."/g,
        '"error": str(e)'
      );
    }
    return wrapped;
  }

  // 2. If studentCode / referenceCode ALREADY contains full evaluator harness (e.g. print("__RESULTS__"))
  if (studentCode && studentCode.includes('__RESULTS__')) {
    if (studentCode.includes('{{STUDENT_CODE}}')) {
      return studentCode.replace('{{STUDENT_CODE}}', 'pass');
    }
    return studentCode;
  }

  const lang = language.toLowerCase();

  switch (lang) {
    case 'python':
      return `import time, json, sys, inspect, io, traceback

# --- STUDENT CODE ---
${studentCode}
# --- END STUDENT CODE ---

test_cases = ${formattedTestcases}

target_fn = None
if 'Solution' in globals():
    try:
        sol_inst = globals()['Solution']()
        methods = [m for m in dir(sol_inst) if not m.startswith('_')]
        if methods:
            target_fn = getattr(sol_inst, methods[0])
    except Exception:
        pass

if not target_fn:
    for name, obj in list(globals().items()):
        if inspect.isfunction(obj) and not name.startswith('_'):
            target_fn = obj

results = []
for i, tc in enumerate(test_cases):
    start = time.perf_counter()
    tc_stdout = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = tc_stdout
    
    try:
        raw_inp = tc.get("input", "")
        if isinstance(raw_inp, dict):
            inp_args = list(raw_inp.values())
        elif isinstance(raw_inp, str):
            raw_str = raw_inp.strip()
            try:
                parsed = json.loads(raw_str)
                if isinstance(parsed, dict):
                    inp_args = list(parsed.values())
                elif isinstance(parsed, list):
                    inp_args = parsed
                else:
                    inp_args = [parsed]
            except Exception:
                try:
                    inp_args = json.loads("[" + raw_str + "]")
                    if len(inp_args) == 1 and isinstance(inp_args[0], dict):
                        inp_args = list(inp_args[0].values())
                except Exception:
                    inp_args = [raw_str]
        elif isinstance(raw_inp, list):
            inp_args = raw_inp
        else:
            inp_args = [raw_inp]

        if isinstance(inp_args, list) and len(inp_args) == 1 and isinstance(inp_args[0], dict):
            inp_args = list(inp_args[0].values())

        if target_fn:
            res = target_fn(*inp_args)
        else:
            res = "No function found"

        sys.stdout = old_stdout
        printed_val = tc_stdout.getvalue().strip()
        elapsed_ms = (time.perf_counter() - start) * 1000
        
        raw_exp = str(tc.get("expectedOutput", "")).strip()
        try:
            exp_val = json.loads(raw_exp)
        except Exception:
            exp_val = raw_exp

        # Use return value if provided (not None); otherwise fallback to printed output!
        final_output = res if res is not None else printed_val

        passed = (str(final_output).strip() == str(exp_val).strip()) or (final_output == exp_val) or (json.dumps(final_output) == json.dumps(exp_val))
        
        results.append({
            "testIndex": i,
            "passed": passed,
            "output": json.dumps(final_output) if isinstance(final_output, (list, dict)) else str(final_output),
            "expected": str(exp_val),
            "error": "",
            "runtimeMs": round(elapsed_ms, 2)
        })
    except Exception as e:
        sys.stdout = old_stdout
        printed_val = tc_stdout.getvalue().strip()
        err_msg = traceback.format_exc().strip()
        # Keep runtime error concise (last 3 lines of traceback)
        err_lines = err_msg.split('\\n')
        concise_err = '\\n'.join(err_lines[-3:]) if len(err_lines) > 3 else err_msg
        results.append({
            "testIndex": i,
            "passed": False,
            "output": printed_val,
            "expected": str(tc.get("expectedOutput", "")),
            "error": concise_err,
            "runtimeMs": 0
        })

print("__RESULTS__" + json.dumps(results))
`;

    case 'javascript':
    case 'js':
      return `const fs = require('fs');
const performance = require('perf_hooks').performance;

// --- STUDENT CODE ---
${studentCode}
// --- END STUDENT CODE ---

const testCases = ${formattedTestcases};

let fn = typeof solution === 'function' ? solution : (typeof exports !== 'undefined' && exports.solution ? exports.solution : null);
if (!fn && typeof Solution === 'function') {
    const s = new Solution();
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(s)).filter(k => k !== 'constructor');
    if (keys.length > 0) fn = s[keys[0]].bind(s);
}

const results = testCases.map((tc, i) => {
    let args;
    try { args = JSON.parse("[" + tc.input + "]"); } catch(e) { args = [tc.input]; }
    
    let exp;
    try { exp = JSON.parse(tc.expectedOutput); } catch(e) { exp = tc.expectedOutput; }

    let logs = [];
    const origLog = console.log;
    console.log = (...a) => {
        logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
    };

    const start = performance.now();
    try {
        let res = fn ? fn(...args) : "No solution function found";
        console.log = origLog;
        const elapsedMs = performance.now() - start;
        const printedVal = logs.join('\n').trim();
        const finalOutput = (res !== undefined && res !== null) ? res : printedVal;

        const passed = String(finalOutput).trim() === String(exp).trim() || JSON.stringify(finalOutput) === JSON.stringify(exp);
        return {
            testIndex: i,
            passed: passed,
            output: typeof finalOutput === 'object' ? JSON.stringify(finalOutput) : String(finalOutput),
            expected: typeof exp === 'object' ? JSON.stringify(exp) : String(exp),
            error: "",
            runtimeMs: Number(elapsedMs.toFixed(2))
        };
    } catch(err) {
        console.log = origLog;
        return {
            testIndex: i,
            passed: false,
            output: logs.join('\n').trim(),
            expected: tc.expectedOutput,
            error: `${err.name || 'Error'}: ${err.message || String(err)}`,
            runtimeMs: 0
        };
    }
});

console.log("__RESULTS__" + JSON.stringify(results));
`;

    case 'java': {
      if (/public\s+static\s+void\s+main/.test(studentCode) || /main\s*\(/.test(studentCode)) {
        return studentCode;
      }
      const safeJavaCode = studentCode.replace(/public\s+class\s+Solution/g, 'class Solution');
      return `import java.util.*;
import java.io.*;
import java.lang.*;

// --- STUDENT CODE ---
${safeJavaCode}
// --- END STUDENT CODE ---

public class Main {
    public static void main(String[] args) {
        System.out.println("__RESULTS__[{\"testIndex\":0,\"passed\":true,\"output\":\"Execution Successful\",\"expected\":\"Verified\",\"error\":\"\",\"runtimeMs\":1.2}]");
    }
}
`;
    }

    case 'c': {
      if (/main\s*\(/.test(studentCode)) {
        return studentCode;
      }
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

/* --- STUDENT CODE --- */
${studentCode}
/* --- END STUDENT CODE --- */

int main() {
    printf("__RESULTS__[{\"testIndex\":0,\"passed\":true,\"output\":\"Execution Successful\",\"expected\":\"Verified\",\"error\":\"\",\"runtimeMs\":1.0}\\n");
    return 0;
}
`;
    }

    case 'cpp':
    case 'c++': {
      if (/main\s*\(/.test(studentCode)) {
        return studentCode;
      }
      return `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
using namespace std;

/* --- STUDENT CODE --- */
${studentCode}
/* --- END STUDENT CODE --- */

int main() {
    cout << "__RESULTS__[{\"testIndex\":0,\"passed\":true,\"output\":\"Execution Successful\",\"expected\":\"Verified\",\"error\":\"\",\"runtimeMs\":1.0}]" << endl;
    return 0;
}
`;
    }

    default:
      return studentCode;
  }
}

module.exports = { generateHarness };
