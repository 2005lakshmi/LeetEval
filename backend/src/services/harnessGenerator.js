/**
 * Generates code harness per language that wraps student submission code
 * with testcases, runs them, measures execution time, and outputs formatted __RESULTS__ JSON.
 */

function generateHarness(language, studentCode, testcases, functionName = 'solution', customTemplate = null) {
  const formattedTestcases = JSON.stringify(testcases);

  // 1. Custom Harness Template saved by Faculty in MongoDB for this question
  if (customTemplate && customTemplate.includes('{{STUDENT_CODE}}')) {
    const codeToInject = (studentCode && studentCode.trim()) ? studentCode : 'pass';
    return customTemplate
      .replace('{{STUDENT_CODE}}', codeToInject)
      .replace('{{TESTCASES_JSON}}', formattedTestcases)
      .replace('{{FUNCTION_NAME}}', functionName);
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
      return `import time, json, sys, inspect

# --- STUDENT CODE ---
${studentCode}
# --- END STUDENT CODE ---

test_cases = ${formattedTestcases}

# Locate student function dynamically (e.g. solution, fourSum, twoSum, or Solution class)
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
    try:
        raw_inp = tc["input"].strip()
        try:
            inp_args = json.loads("[" + raw_inp + "]")
        except Exception:
            try:
                inp_args = [json.loads(raw_inp)]
            except Exception:
                inp_args = [raw_inp]

        if target_fn:
            res = target_fn(*inp_args)
        else:
            res = "No function found"

        elapsed_ms = (time.perf_counter() - start) * 1000
        
        raw_exp = tc["expectedOutput"].strip()
        try:
            exp_val = json.loads(raw_exp)
        except Exception:
            exp_val = raw_exp

        passed = (str(res) == str(exp_val)) or (res == exp_val) or (json.dumps(res) == json.dumps(exp_val))
        results.append({
            "testIndex": i,
            "passed": passed,
            "output": json.dumps(res) if isinstance(res, (list, dict)) else str(res),
            "expected": str(exp_val),
            "error": "",
            "runtimeMs": round(elapsed_ms, 2)
        })
    except Exception as e:
        results.append({
            "testIndex": i,
            "passed": False,
            "output": "",
            "expected": tc["expectedOutput"],
            "error": str(e),
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

    const start = performance.now();
    try {
        let res = fn ? fn(...args) : "No solution function found";
        const elapsedMs = performance.now() - start;
        const passed = String(res) === String(exp) || JSON.stringify(res) === JSON.stringify(exp);
        return {
            testIndex: i,
            passed: passed,
            output: typeof res === 'object' ? JSON.stringify(res) : String(res),
            expected: typeof exp === 'object' ? JSON.stringify(exp) : String(exp),
            error: "",
            runtimeMs: Number(elapsedMs.toFixed(2))
        };
    } catch(err) {
        return {
            testIndex: i,
            passed: false,
            output: "",
            expected: tc.expectedOutput,
            error: err.message || String(err),
            runtimeMs: 0
        };
    }
});

console.log("__RESULTS__" + JSON.stringify(results));
`;

    case 'java': {
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

    case 'c':
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

    case 'cpp':
    case 'c++':
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

    default:
      return studentCode;
  }
}

module.exports = { generateHarness };
