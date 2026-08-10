/**
 * Utility to generate the 5-language AI Harness Generation Prompt based on 4sum.txt structure
 */
export const generateHarnessAiPrompt = (question) => {
  if (!question) return '';

  const title = question.title || 'Untitled Question';

  // Convert HTML description into clean, readable text
  let descriptionText = '';
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = question.descriptionHtml || '';
    descriptionText = tempDiv.innerText || tempDiv.textContent || question.descriptionHtml || '';
  } else {
    descriptionText = (question.descriptionHtml || '').replace(/<[^>]*>?/gm, '');
  }
  descriptionText = descriptionText.trim();

  const bp = question.boilerplate || {};
  const pyBp = bp.python || '# Python 3 boilerplate\nclass Solution:\n    def solution(self, input_val):\n        pass';
  const jsBp = bp.javascript || bp.js || '// JavaScript boilerplate\nvar solution = function(input_val) {\n    return null;\n};';
  const javaBp = bp.java || '// Java boilerplate\nclass Solution {\n    public Object solution(Object input) {\n        return null;\n    }\n}';
  const cBp = bp.c || '// C boilerplate\nint solution(int input) {\n    return 0;\n}';
  const cppBp = bp.cpp || bp['c++'] || '// C++ boilerplate\nclass Solution {\npublic:\n    int solution(int input) {\n        return 0;\n    }\n};';

  const testcasesFormatted = JSON.stringify(question.sampleTestcases || [], null, 2);

  return `I'm building test-execution harnesses for a coding assessment platform. I've attached 4sum.txt, which is a working example of the exact format and conventions I need you to follow for every new question.

Study 4sum.txt carefully and replicate its structure exactly:
- One section per language, in this order: PYTHON, JAVASCRIPT(NODEJS), JAVA, C, CPP
- A commented-out reference/correct solution shown first for context (not executed)
- A {{STUDENT_CODE}} placeholder marking exactly where the student's submitted code gets injected
- A test_cases / testCases list with realistic sample + edge cases (empty input, single element, duplicates, negative numbers, large values, no-solution cases, multiple-solution cases) — aim for 15-20 cases per language covering the same logical scenarios across all languages
- If output order doesn't matter (e.g. returning a list of results), include the same kind of normalize()/compare() helper functions 4sum.txt uses, so ordering differences don't cause false failures
- A main()/execution block that: runs the student's function against every test case, times each one, catches exceptions per-case (never let one bad case crash the whole run), and builds a results array
- Final output MUST be: print a line containing exactly __RESULTS__, then a single line of JSON with this exact schema:
  {"status": "Accepted"|"Wrong Answer", "passed": <int>, "total": <int>,
   "testCases": [{"testCase": <int>, "input": <obj>, "expectedOutput": <val>,
   "actualOutput": <val>, "passed": <bool>, "runtime": <float ms>, "error": <string, only if failed>}]}
- For C and C++, since there's no native JSON library, hand-roll the JSON output the same way 4sum.txt does (toJson() helper functions) — don't add external dependencies

Here is the new question:

Title: ${title}
Description:
${descriptionText}

Function signature / boilerplate per language:
- Python:
${pyBp}

- JavaScript:
${jsBp}

- Java:
${javaBp}

- C:
${cBp}

- C++:
${cppBp}

Sample testcases (visible to student):
${testcasesFormatted}


Generate the complete harness file now, following 4sum.txt's format exactly, for all 5 languages, so I can run it locally to verify a correct reference solution passes 100% before uploading the question to the portal.


============================================================
REFERENCE 4SUM HARNESS CONVENTION TEMPLATE (4sum.txt)
============================================================

PYTHON

# Correct solution (commented out for reference, can be used as a guide)

import json
import time

# ============================================================
# STUDENT CODE
# ============================================================

# class Solution(object):
#     def fourSum(self, nums, target):
#         nums.sort()
#         n = len(nums)
#         res = []
#         for i in range(n - 3):
#             if i > 0 and nums[i] == nums[i - 1]:
#                 continue
#             for j in range(i + 1, n - 2):
#                 if j > i + 1 and nums[j] == nums[j - 1]:
#                     continue
#                 left, right = j + 1, n - 1
#                 while left < right:
#                     total = nums[i] + nums[j] + nums[left] + nums[right]
#                     if total == target:
#                         res.append([nums[i], nums[j], nums[left], nums[right]])
#                         while left < right and nums[left] == nums[left + 1]:
#                             left += 1
#                         while left < right and nums[right] == nums[right - 1]:
#                             right -= 1
#                         left += 1
#                         right -= 1
#                     elif total < target:
#                         left += 1
#                     else:
#                         right -= 1
#         return res


{{STUDENT_CODE}}

# ============================================================
# TEST CASES & EVALUATOR
# ============================================================

def normalize(quadruplets):
    """Sort each quadruplet and then sort the outer list lexicographically."""
    return sorted([sorted(q) for q in quadruplets])

def compare(actual, expected):
    return normalize(actual) == normalize(expected)

test_cases = [
    {
        "input": {"nums": [1, 0, -1, 0, -2, 2], "target": 0},
        "expectedOutput": [[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]
    },
    {
        "input": {"nums": [2, 2, 2, 2, 2], "target": 8},
        "expectedOutput": [[2, 2, 2, 2]]
    }
]

def main():
    solution = Solution()
    results = []

    for test_number, test_case in enumerate(test_cases, start=1):
        input_data = test_case["input"]
        nums = input_data["nums"]
        target = input_data["target"]
        expected = test_case["expectedOutput"]

        start_time = time.perf_counter()

        try:
            actual = solution.fourSum(nums, target)
            end_time = time.perf_counter()
            runtime = (end_time - start_time) * 1000
            passed = compare(actual, expected)

            results.append({
                "testCase": test_number,
                "input": input_data,
                "expectedOutput": expected,
                "actualOutput": actual,
                "passed": passed,
                "runtime": round(runtime, 4)
            })
        except Exception as error:
            end_time = time.perf_counter()
            runtime = (end_time - start_time) * 1000
            results.append({
                "testCase": test_number,
                "input": input_data,
                "expectedOutput": expected,
                "actualOutput": None,
                "passed": False,
                "runtime": round(runtime, 4),
                "error": str(error)
            })

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)

    final_result = {
        "status": "Accepted" if passed_count == total_count else "Wrong Answer",
        "passed": passed_count,
        "total": total_count,
        "testCases": results
    }

    print("__RESULTS__")
    print(json.dumps(final_result))

if __name__ == "__main__":
    main()


JAVASCRIPT(NODEJS)

// {{STUDENT_CODE}}

function normalize(quadruplets) {
    const copy = quadruplets.map(q => [...q].sort((a, b) => a - b));
    copy.sort((a, b) => {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] !== b[i]) return a[i] - b[i];
        }
        return a.length - b.length;
    });
    return copy;
}

function compare(actual, expected) {
    const na = normalize(actual);
    const ne = normalize(expected);
    if (na.length !== ne.length) return false;
    for (let i = 0; i < na.length; i++) {
        if (na[i].length !== ne[i].length) return false;
        for (let j = 0; j < na[i].length; j++) {
            if (na[i][j] !== ne[i][j]) return false;
        }
    }
    return true;
}

const testCases = [
    {
        nums: [1, 0, -1, 0, -2, 2],
        target: 0,
        expected: [[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]
    }
];

function main() {
    const results = [];
    let passedCount = 0;

    for (let idx = 0; idx < testCases.length; idx++) {
        const { nums, target, expected } = testCases[idx];
        const testNumber = idx + 1;
        const start = performance.now();
        const result = {
            testCase: testNumber,
            input: { nums, target },
            expectedOutput: expected
        };

        try {
            const actual = fourSum(nums, target);
            const end = performance.now();
            const runtime = Math.round((end - start) * 10000) / 10000;
            const passed = compare(actual, expected);
            result.actualOutput = actual;
            result.passed = passed;
            result.runtime = runtime;
            if (passed) passedCount++;
        } catch (error) {
            const end = performance.now();
            const runtime = Math.round((end - start) * 10000) / 10000;
            result.actualOutput = null;
            result.passed = false;
            result.runtime = runtime;
            result.error = error.toString();
        }
        results.push(result);
    }

    const finalResult = {
        status: passedCount === testCases.length ? "Accepted" : "Wrong Answer",
        passed: passedCount,
        total: testCases.length,
        testCases: results
    };

    console.log("__RESULTS__");
    console.log(JSON.stringify(finalResult));
}

main();


JAVA

{{STUDENT_CODE}}

public class Main {
    static List<List<Integer>> normalize(List<List<Integer>> list) {
        List<List<Integer>> copy = new ArrayList<>();
        for (List<Integer> inner : list) {
            List<Integer> sorted = new ArrayList<>(inner);
            Collections.sort(sorted);
            copy.add(sorted);
        }
        Collections.sort(copy, (a, b) -> {
            for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
                int cmp = a.get(i).compareTo(b.get(i));
                if (cmp != 0) return cmp;
            }
            return Integer.compare(a.size(), b.size());
        });
        return copy;
    }

    static boolean compare(List<List<Integer>> actual, List<List<Integer>> expected) {
        return normalize(actual).equals(normalize(expected));
    }

    static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) {
            return "\"" + ((String) obj).replace("\"", "\\\"") + "\"";
        }
        if (obj instanceof Number || obj instanceof Boolean) {
            return obj.toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(toJson(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        return "\"" + obj.toString() + "\"";
    }

    public static void main(String[] args) {
        Solution solution = new Solution();
        List<Map<String, Object>> results = new ArrayList<>();
        int passedCount = 0;
        
        Map<String, Object> finalResult = new LinkedHashMap<>();
        finalResult.put("status", passedCount == 1 ? "Accepted" : "Wrong Answer");
        finalResult.put("passed", passedCount);
        finalResult.put("total", 1);
        finalResult.put("testCases", results);

        System.out.println("__RESULTS__");
        System.out.println(toJson(finalResult));
    }
}


CLANGUAGE

{{STUDENT_CODE}}

int main() {
    printf("__RESULTS__\\n");
    printf("{\\"status\\":\\"Accepted\\",\\"passed\\":1,\\"total\\":1,\\"testCases\\":[]}");
    return 0;
}


C++ LANGUAGE

{{STUDENT_CODE}}

int main() {
    cout << "__RESULTS__\\n";
    cout << "{\\"status\\":\\"Accepted\\",\\"passed\\":1,\\"total\\":1,\\"testCases\\":[]}" << endl;
    return 0;
}
`;
};
