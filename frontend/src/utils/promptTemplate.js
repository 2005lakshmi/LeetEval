/**
 * COMBINED PROMPT TEMPLATE & EXAMPLE (prompt.txt)
 * Includes PRINT RECTANGLE USING ASTERISKS Reference Example & Harness Generation Prompt
 */
export const COMBINED_PROMPT_TEXT = `TITLE: PRINT RECTANGLE USING ASTERISKS

============================================================
DESCRIPTION
============================================================

<p>Given two integers <code>length</code> and <code>breadth</code> representing the dimensions of a rectangle, print a rectangle using the <code>*</code> character.</p>

<p>The rectangle must contain <code>length</code> rows and <code>breadth</code> asterisks in each row.</p>

<p>Each row must be printed on a separate line.</p>

<p><b>Example:</b> For <code>length = 3</code> and <code>breadth = 5</code>, print:</p>

<pre>
*****
*****
*****
</pre>


============================================================
EXAMPLES
============================================================

Example 1:

Input:
length = 3
breadth = 5

Output:
*****
*****
*****


Example 2:

Input:
length = 2
breadth = 4

Output:
****
****


Example 3:

Input:
length = 1
breadth = 6

Output:
******


============================================================
FULL BOILERPLATE
============================================================


-------------------- PYTHON --------------------

def solution(length, breadth):
    # Write your solution here
    pass


-------------------- JAVASCRIPT (NODEJS) --------------------

function solution(length, breadth) {
    // Write your solution here
}


-------------------- JAVA --------------------

class Solution {
    public void solution(int length, int breadth) {
        // Write your solution here
    }
}


-------------------- C --------------------

#include <stdio.h>

void solution(int length, int breadth) {
    // Write your solution here
}


-------------------- C++ --------------------

#include <iostream>
using namespace std;

void solution(int length, int breadth) {
    // Write your solution here
}


============================================================
HARNESS CODE
============================================================


============================================================
PYTHON
============================================================

import json
import time
import io
from contextlib import redirect_stdout


# Correct reference solution:
# def solution(length, breadth):
#     for i in range(length):
#         print("*" * breadth)


#{{STUDENT_CODE}}


test_cases = [
    {
        "input": {"length": 1, "breadth": 1},
        "expectedOutput": "*"
    },
    {
        "input": {"length": 1, "breadth": 5},
        "expectedOutput": "*****"
    },
    {
        "input": {"length": 2, "breadth": 4},
        "expectedOutput": "****\\n****"
    },
    {
        "input": {"length": 3, "breadth": 5},
        "expectedOutput": "*****\\n*****\\n*****"
    },
    {
        "input": {"length": 4, "breadth": 3},
        "expectedOutput": "***\\n***\\n***\\n***"
    },
    {
        "input": {"length": 5, "breadth": 2},
        "expectedOutput": "**\\n**\\n**\\n**\\n**"
    },
    {
        "input": {"length": 3, "breadth": 3},
        "expectedOutput": "***\\n***\\n***"
    },
    {
        "input": {"length": 6, "breadth": 1},
        "expectedOutput": "*\\n*\\n*\\n*\\n*\\n*"
    },
    {
        "input": {"length": 1, "breadth": 10},
        "expectedOutput": "**********"
    },
    {
        "input": {"length": 10, "breadth": 1},
        "expectedOutput": "*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*"
    },
    {
        "input": {"length": 5, "breadth": 5},
        "expectedOutput": "*****\\n*****\\n*****\\n*****\\n*****"
    },
    {
        "input": {"length": 2, "breadth": 8},
        "expectedOutput": "********\\n********"
    },
    {
        "input": {"length": 7, "breadth": 4},
        "expectedOutput": "****\\n****\\n****\\n****\\n****\\n****\\n****"
    },
    {
        "input": {"length": 4, "breadth": 7},
        "expectedOutput": "*******\\n*******\\n*******\\n*******"
    },
    {
        "input": {"length": 8, "breadth": 3},
        "expectedOutput": "***\\n***\\n***\\n***\\n***\\n***\\n***\\n***"
    },
    {
        "input": {"length": 3, "breadth": 10},
        "expectedOutput": "**********\\n**********\\n**********"
    },
    {
        "input": {"length": 10, "breadth": 10},
        "expectedOutput": "**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********"
    },
    {
        "input": {"length": 2, "breadth": 2},
        "expectedOutput": "**\\n**"
    }
]


def normalize(output):
    if output is None:
        return ""
    return str(output).strip()


def compare(actual, expected):
    return normalize(actual) == normalize(expected)


def main():
    results = []
    passed_count = 0

    for index, test_case in enumerate(test_cases):

        length = test_case["input"]["length"]
        breadth = test_case["input"]["breadth"]
        expected = test_case["expectedOutput"]

        result = {
            "testCase": index + 1,
            "input": test_case["input"],
            "expectedOutput": expected
        }

        start = time.perf_counter()

        try:
            captured_output = io.StringIO()

            with redirect_stdout(captured_output):
                actual_return = solution(length, breadth)

            actual_output = captured_output.getvalue()

            if actual_output.strip() == "" and actual_return is not None:
                actual_output = str(actual_return)

            runtime = round(
                (time.perf_counter() - start) * 1000,
                4
            )

            passed = compare(actual_output, expected)

            result["actualOutput"] = actual_output.strip()
            result["passed"] = passed
            result["runtime"] = runtime

            if passed:
                passed_count += 1
            else:
                result["error"] = (
                    "Printed output does not match expected output."
                )

        except Exception as error:

            runtime = round(
                (time.perf_counter() - start) * 1000,
                4
            )

            result["actualOutput"] = None
            result["passed"] = False
            result["runtime"] = runtime
            result["error"] = str(error)

        results.append(result)

    final_result = {
        "status": (
            "Accepted"
            if passed_count == len(test_cases)
            else "Wrong Answer"
        ),
        "passed": passed_count,
        "total": len(test_cases),
        "testCases": results
    }

    print("__RESULTS__")
    print(json.dumps(final_result))


if __name__ == "__main__":
    main()


============================================================
JAVASCRIPT (NODEJS)
============================================================

{{STUDENT_CODE}}


const testCases = [
    { input: { length: 1, breadth: 1 }, expectedOutput: "*" },
    { input: { length: 1, breadth: 5 }, expectedOutput: "*****" },
    { input: { length: 2, breadth: 4 }, expectedOutput: "****\\n****" },
    { input: { length: 3, breadth: 5 }, expectedOutput: "*****\\n*****\\n*****" },
    { input: { length: 4, breadth: 3 }, expectedOutput: "***\\n***\\n***\\n***" },
    { input: { length: 5, breadth: 2 }, expectedOutput: "**\\n**\\n**\\n**\\n**" },
    { input: { length: 3, breadth: 3 }, expectedOutput: "***\\n***\\n***" },
    { input: { length: 6, breadth: 1 }, expectedOutput: "*\\n*\\n*\\n*\\n*\\n*" },
    { input: { length: 1, breadth: 10 }, expectedOutput: "**********" },
    { input: { length: 10, breadth: 1 }, expectedOutput: "*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*" },
    { input: { length: 5, breadth: 5 }, expectedOutput: "*****\\n*****\\n*****\\n*****\\n*****" },
    { input: { length: 2, breadth: 8 }, expectedOutput: "********\\n********" },
    { input: { length: 7, breadth: 4 }, expectedOutput: "****\\n****\\n****\\n****\\n****\\n****\\n****" },
    { input: { length: 4, breadth: 7 }, expectedOutput: "*******\\n*******\\n*******\\n*******" },
    { input: { length: 8, breadth: 3 }, expectedOutput: "***\\n***\\n***\\n***\\n***\\n***\\n***\\n***" },
    { input: { length: 3, breadth: 10 }, expectedOutput: "**********\\n**********\\n**********" },
    { input: { length: 10, breadth: 10 }, expectedOutput: "**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********" },
    { input: { length: 2, breadth: 2 }, expectedOutput: "**\\n**" }
];


function normalize(output) {
    if (output === undefined || output === null) {
        return "";
    }
    return String(output).trim();
}


function compare(actual, expected) {
    return normalize(actual) === normalize(expected);
}


function main() {
    const results = [];
    let passedCount = 0;

    for (let index = 0; index < testCases.length; index++) {

        const testCase = testCases[index];
        const length = testCase.input.length;
        const breadth = testCase.input.breadth;
        const expected = testCase.expectedOutput;

        const result = {
            testCase: index + 1,
            input: testCase.input,
            expectedOutput: expected
        };

        const start = process.hrtime.bigint();

        try {
            let printedOutput = "";
            const originalLog = console.log;

            console.log = function (...args) {
                printedOutput += args.join(" ") + "\\n";
            };

            let actualReturn;

            try {
                actualReturn = solution(length, breadth);
            } finally {
                console.log = originalLog;
            }

            if (printedOutput.trim() === "" && actualReturn !== undefined && actualReturn !== null) {
                printedOutput = String(actualReturn);
            }

            const end = process.hrtime.bigint();
            const runtime = Number(end - start) / 1000000;
            const actualOutput = printedOutput.trim();
            const passed = compare(actualOutput, expected);

            result.actualOutput = actualOutput;
            result.passed = passed;
            result.runtime = Number(runtime.toFixed(4));

            if (passed) {
                passedCount++;
            } else {
                result.error = "Printed output does not match expected output.";
            }

        } catch (error) {
            const end = process.hrtime.bigint();
            const runtime = Number(end - start) / 1000000;
            result.actualOutput = null;
            result.passed = false;
            result.runtime = Number(runtime.toFixed(4));
            result.error = String(error);
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


============================================================
JAVA
============================================================

//{{STUDENT_CODE}}

public class Main {
    static int[][] testInputs = {
        {1, 1}, {1, 5}, {2, 4}, {3, 5}, {4, 3}, {5, 2}, {3, 3}, {6, 1}, {1, 10},
        {10, 1}, {5, 5}, {2, 8}, {7, 4}, {4, 7}, {8, 3}, {3, 10}, {10, 10}, {2, 2}
    };

    static String[] expectedOutputs = {
        "*", "*****", "****\\n****", "*****\\n*****\\n*****", "***\\n***\\n***\\n***", "**\\n**\\n**\\n**\\n**",
        "***\\n***\\n***", "*\\n*\\n*\\n*\\n*\\n*", "**********", "*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*",
        "*****\\n*****\\n*****\\n*****\\n*****", "********\\n********", "****\\n****\\n****\\n****\\n****\\n****\\n****",
        "*******\\n*******\\n*******\\n*******", "***\\n***\\n***\\n***\\n***\\n***\\n***\\n***",
        "**********\\n**********\\n**********", "**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********",
        "**\\n**"
    };

    static String normalize(String output) {
        if (output == null) return "";
        return output.trim().replace("\\r\\n", "\\n").replace("\\r", "\\n");
    }

    static boolean compare(String actual, String expected) {
        return normalize(actual).equals(normalize(expected));
    }

    static String escapeJson(String value) {
        if (value == null) return "null";
        return "\"" + value.replace("\\\\", "\\\\\\\\").replace("\"", "\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r").replace("\\t", "\\\\t") + "\"";
    }

    static String toJson(Object value) {
        if (value == null) return "null";
        if (value instanceof String) return escapeJson((String) value);
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        if (value instanceof java.util.Map) {
            java.util.Map<?, ?> map = (java.util.Map<?, ?>) value;
            StringBuilder json = new StringBuilder("{");
            int count = 0;
            for (java.util.Map.Entry<?, ?> entry : map.entrySet()) {
                if (count++ > 0) json.append(",");
                json.append(escapeJson(entry.getKey().toString()));
                json.append(":");
                json.append(toJson(entry.getValue()));
            }
            json.append("}");
            return json.toString();
        }
        if (value instanceof java.util.List) {
            java.util.List<?> list = (java.util.List<?>) value;
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) json.append(",");
                json.append(toJson(list.get(i)));
            }
            json.append("]");
            return json.toString();
        }
        return escapeJson(value.toString());
    }

    public static void main(String[] args) {
        java.util.List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();
        int passedCount = 0;

        for (int index = 0; index < testInputs.length; index++) {
            int length = testInputs[index][0];
            int breadth = testInputs[index][1];
            String expected = expectedOutputs[index];

            java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("testCase", index + 1);

            java.util.Map<String, Object> input = new java.util.LinkedHashMap<>();
            input.put("length", length);
            input.put("breadth", breadth);

            result.put("input", input);
            result.put("expectedOutput", expected);

            long start = System.nanoTime();

            try {
                java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
                java.io.PrintStream capture = new java.io.PrintStream(output);
                java.io.PrintStream original = System.out;
                System.setOut(capture);

                try {
                    Solution solution = new Solution();
                    solution.solution(length, breadth);
                } finally {
                    System.out.flush();
                    System.setOut(original);
                }

                String actual = output.toString();
                long end = System.nanoTime();
                double runtime = (end - start) / 1_000_000.0;
                boolean passed = compare(actual, expected);

                result.put("actualOutput", normalize(actual));
                result.put("passed", passed);
                result.put("runtime", Math.round(runtime * 10000.0) / 10000.0);

                if (passed) {
                    passedCount++;
                } else {
                    result.put("error", "Printed output does not match expected output.");
                }
            } catch (Exception error) {
                long end = System.nanoTime();
                double runtime = (end - start) / 1_000_000.0;
                result.put("actualOutput", null);
                result.put("passed", false);
                result.put("runtime", Math.round(runtime * 10000.0) / 10000.0);
                result.put("error", error.toString());
            }

            results.add(result);
        }

        java.util.Map<String, Object> finalResult = new java.util.LinkedHashMap<>();
        finalResult.put("status", passedCount == testInputs.length ? "Accepted" : "Wrong Answer");
        finalResult.put("passed", passedCount);
        finalResult.put("total", testInputs.length);
        finalResult.put("testCases", results);

        System.out.println("__RESULTS__");
        System.out.println(toJson(finalResult));
    }
}


============================================================
C
============================================================

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

//{{STUDENT_CODE}}

typedef struct {
    int length;
    int breadth;
    const char *expectedOutput;
} TestCase;

typedef struct {
    char *actualOutput;
    int passed;
    double runtime;
    char error[256];
} TestResult;

void printJsonString(const char *value) {
    putchar('"');
    if (value != NULL) {
        while (*value) {
            if (*value == '"' || *value == '\\\\') {
                putchar('\\\\');
            }
            if (*value == '\\n') {
                printf("\\\\n");
            } else if (*value == '\\r') {
                printf("\\\\r");
            } else if (*value == '\\t') {
                printf("\\\\t");
            } else {
                putchar(*value);
            }
            value++;
        }
    }
    putchar('"');
}

char *normalizeOutput(const char *output) {
    if (output == NULL) {
        char *empty = malloc(1);
        empty[0] = '\\0';
        return empty;
    }
    size_t length = strlen(output);
    while (length > 0 && (output[length - 1] == '\\n' || output[length - 1] == '\\r' || output[length - 1] == ' ' || output[length - 1] == '\\t')) {
        length--;
    }
    char *result = malloc(length + 1);
    if (result == NULL) return NULL;
    memcpy(result, output, length);
    result[length] = '\\0';
    return result;
}

int compareOutput(const char *actual, const char *expected) {
    char *actualNormalized = normalizeOutput(actual);
    char *expectedNormalized = normalizeOutput(expected);
    if (actualNormalized == NULL || expectedNormalized == NULL) {
        free(actualNormalized); free(expectedNormalized);
        return 0;
    }
    int result = strcmp(actualNormalized, expectedNormalized) == 0;
    free(actualNormalized); free(expectedNormalized);
    return result;
}

char *generateExpectedOutput(int length, int breadth) {
    int size = length * (breadth + 1) + 1;
    char *output = malloc(size);
    if (output == NULL) return NULL;
    int position = 0;
    for (int i = 0; i < length; i++) {
        for (int j = 0; j < breadth; j++) {
            output[position++] = '*';
        }
        output[position++] = '\\n';
    }
    output[position] = '\\0';
    return output;
}

int main(void) {
    TestCase testCases[] = {
        {1, 1, "*"}, {1, 5, "*****"}, {2, 4, "****\\n****"}, {3, 5, "*****\\n*****\\n*****"},
        {4, 3, "***\\n***\\n***\\n***"}, {5, 2, "**\\n**\\n**\\n**\\n**"}, {3, 3, "***\\n***\\n***"},
        {6, 1, "*\\n*\\n*\\n*\\n*\\n*"}, {1, 10, "**********"}, {10, 1, "*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*"},
        {5, 5, "*****\\n*****\\n*****\\n*****\\n*****"}, {2, 8, "********\\n********"},
        {7, 4, "****\\n****\\n****\\n****\\n****\\n****\\n****"}, {4, 7, "*******\\n*******\\n*******\\n*******"},
        {8, 3, "***\\n***\\n***\\n***\\n***\\n***\\n***\\n***"}, {3, 10, "**********\\n**********\\n**********"},
        {10, 10, "**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********"},
        {2, 2, "**\\n**"}
    };

    int total = sizeof(testCases) / sizeof(testCases[0]);
    TestResult *results = malloc(sizeof(TestResult) * total);
    if (results == NULL) return 0;
    int passedCount = 0;

    for (int index = 0; index < total; index++) {
        TestCase testCase = testCases[index];
        char *expected = generateExpectedOutput(testCase.length, testCase.breadth);
        size_t capacity = (size_t)testCase.length * (testCase.breadth + 1) + 1024;
        char *actual = malloc(capacity);
        if (actual == NULL || expected == NULL) { free(expected); continue; }
        actual[0] = '\\0';

        FILE *temporary = tmpfile();
        if (temporary == NULL) { free(expected); free(actual); continue; }

        fflush(stdout);
        int originalStdout = fileno(stdout);
        int savedStdout = dup(originalStdout);
        clock_t start = clock();

        fflush(stdout);
        dup2(fileno(temporary), originalStdout);
        solution(testCase.length, testCase.breadth);
        fflush(stdout);
        dup2(savedStdout, originalStdout);
        close(savedStdout);

        double runtime = ((double)(clock() - start) / CLOCKS_PER_SEC) * 1000.0;
        fflush(temporary);
        fseek(temporary, 0, SEEK_SET);
        size_t bytesRead = fread(actual, 1, capacity - 1, temporary);
        actual[bytesRead] = '\\0';
        fclose(temporary);

        int passed = compareOutput(actual, expected);
        results[index].actualOutput = actual;
        results[index].passed = passed;
        results[index].runtime = runtime;

        if (passed) passedCount++;
        else strcpy(results[index].error, "Printed output does not match expected output.");
        free(expected);
    }

    printf("__RESULTS__\\n");
    printf("{\"status\":\"%s\",\"passed\":%d,\"total\":%d,\"testCases\":[", passedCount == total ? "Accepted" : "Wrong Answer", passedCount, total);
    for (int index = 0; index < total; index++) {
        if (index > 0) printf(",");
        printf("{\"testCase\":%d,\"input\":{\"length\":%d,\"breadth\":%d},\"expectedOutput\":", index + 1, testCases[index].length, testCases[index].breadth);
        char *expected = generateExpectedOutput(testCases[index].length, testCases[index].breadth);
        printJsonString(expected);
        free(expected);
        printf(",\"actualOutput\":");
        printJsonString(results[index].actualOutput);
        printf(",\"passed\":%s,\"runtime\":%.4f", results[index].passed ? "true" : "false", results[index].runtime);
        if (!results[index].passed) {
            printf(",\"error\":");
            printJsonString(results[index].error);
        }
        printf("}");
        free(results[index].actualOutput);
    }
    printf("]}\n");
    free(results);
    return 0;
}


============================================================
C++
============================================================

#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <chrono>

using namespace std;

//{{STUDENT_CODE}}

struct TestCase {
    int length;
    int breadth;
    string expectedOutput;
};

struct TestResult {
    string actualOutput;
    bool passed;
    double runtime;
    string error;
};

string normalizeOutput(const string& output) {
    string result = output;
    while (!result.empty() && (result.back() == '\\n' || result.back() == '\\r' || result.back() == ' ' || result.back() == '\\t')) {
        result.pop_back();
    }
    return result;
}

bool compareOutput(const string& actual, const string& expected) {
    return normalizeOutput(actual) == normalizeOutput(expected);
}

string escapeJson(const string& value) {
    string result;
    for (char c : value) {
        if (c == '"' || c == '\\\\') result += '\\\\';
        if (c == '\\n') result += "\\\\n";
        else if (c == '\\r') result += "\\\\r";
        else if (c == '\\t') result += "\\\\t";
        else result += c;
    }
    return result;
}

string toJsonString(const string& value) {
    return "\"" + escapeJson(value) + "\"";
}

int main() {
    vector<TestCase> testCases = {
        {1, 1, "*"}, {1, 5, "*****"}, {2, 4, "****\\n****"}, {3, 5, "*****\\n*****\\n*****"},
        {4, 3, "***\\n***\\n***\\n***"}, {5, 2, "**\\n**\\n**\\n**\\n**"}, {3, 3, "***\\n***\\n***"},
        {6, 1, "*\\n*\\n*\\n*\\n*\\n*"}, {1, 10, "**********"}, {10, 1, "*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*\\n*"},
        {5, 5, "*****\\n*****\\n*****\\n*****\\n*****"}, {2, 8, "********\\n********"},
        {7, 4, "****\\n****\\n****\\n****\\n****\\n****\\n****"}, {4, 7, "*******\\n*******\\n*******\\n*******"},
        {8, 3, "***\\n***\\n***\\n***\\n***\\n***\\n***\\n***"}, {3, 10, "**********\\n**********\\n**********"},
        {10, 10, "**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********\\n**********"},
        {2, 2, "**\\n**"}
    };

    vector<TestResult> results;
    int passedCount = 0;

    for (size_t i = 0; i < testCases.size(); i++) {
        const TestCase& testCase = testCases[i];
        TestResult result;
        auto start = chrono::high_resolution_clock::now();

        try {
            ostringstream capturedOutput;
            streambuf* originalBuffer = cout.rdbuf(capturedOutput.rdbuf());
            try {
                solution(testCase.length, testCase.breadth);
            } catch (...) {
                cout.rdbuf(originalBuffer);
                throw;
            }
            cout.rdbuf(originalBuffer);
            result.actualOutput = capturedOutput.str();
            result.passed = compareOutput(result.actualOutput, testCase.expectedOutput);
            if (result.passed) passedCount++;
            else result.error = "Printed output does not match expected output.";
        } catch (const exception& error) {
            result.actualOutput = "";
            result.passed = false;
            result.error = error.what();
        } catch (...) {
            result.actualOutput = "";
            result.passed = false;
            result.error = "Unknown exception.";
        }

        auto end = chrono::high_resolution_clock::now();
        result.runtime = chrono::duration<double, milli>(end - start).count();
        results.push_back(result);
    }

    cout << "__RESULTS__" << endl;
    cout << "{\"status\":\"" << (passedCount == (int)testCases.size() ? "Accepted" : "Wrong Answer") << "\",\"passed\":" << passedCount << ",\"total\":" << testCases.size() << ",\"testCases\":[";

    for (size_t i = 0; i < testCases.size(); i++) {
        if (i > 0) cout << ",";
        const TestCase& testCase = testCases[i];
        const TestResult& result = results[i];
        cout << "{\"testCase\":" << i + 1;
        cout << ",\"input\":{\"length\":" << testCase.length << ",\"breadth\":" << testCase.breadth << "}";
        cout << ",\"expectedOutput\":" << toJsonString(testCase.expectedOutput);
        cout << ",\"actualOutput\":" << toJsonString(normalizeOutput(result.actualOutput));
        cout << ",\"passed\":" << (result.passed ? "true" : "false");
        cout << ",\"runtime\":" << fixed << setprecision(4) << result.runtime;
        if (!result.passed) cout << ",\"error\":" << toJsonString(result.error);
        cout << "}";
    }

    cout << "]}" << endl;
    return 0;
}


============================================================
CODING ASSESSMENT HARNESS GENERATION PROMPT
============================================================

Use the following rules whenever generating a new coding-assessment
question TXT file.

The existing Square Box question TXT is the reference for the overall
format, structure, and execution conventions.

IMPORTANT:
The question DESCRIPTION must use HTML tags directly, for example:

<p>Given an integer <code>n</code>, return the sum of its digits.</p>
<p><b>Example:</b> For <code>n = 123</code>, the answer is <code>6</code>.</p>

Do NOT create a complete HTML document.
Do NOT use <html>, <head>, <body>, etc.


============================================================
1. REQUIRED QUESTION STRUCTURE
============================================================

For every question, use this order:

1. Title
2. Description
3. Examples
4. Full student-facing boilerplate for all languages
5. Harness code for all languages

Languages MUST be in this exact order:

PYTHON
JAVASCRIPT (NODEJS)
JAVA
C
C++


============================================================
2. BOILERPLATE / STARTER CODE
============================================================

Provide the COMPLETE student-facing boilerplate first.

The boilerplate itself must NOT be commented out.

The student should be able to see the actual function/method they are
expected to implement.

Example:

class Solution {
    public int solution(int n) {
        // Write your solution here
        return 0;
    }
}

Do not turn the entire boilerplate into comments.


============================================================
3. REFERENCE / CORRECT SOLUTION
============================================================

After the boilerplate sections, provide the harness sections.

Inside each harness, show a correct/reference solution first for context.

The reference solution MUST be commented out so it is not executed.

Example:

// Correct reference solution:
// def solution(n):
//     return n * n


============================================================
4. STUDENT CODE PLACEHOLDER
============================================================

Immediately after the commented reference solution, place:

//{{STUDENT_CODE}}

This is the exact marker where the student's submitted implementation
is injected.

Do NOT execute the reference solution.

The student's solution must be the implementation that the harness runs.


============================================================
5. JAVA RULES — IMPORTANT
============================================================

Java is especially important because of the class-name / filename issue.

Always use:

class Solution {
    ...
}

NOT:

public class Solution {
    ...
}

The runner must use:

public class Main {
    public static void main(String[] args) {
        ...
    }
}

This avoids the common Java error caused by a public Solution class being
compiled in a file named Main.java.

The harness should instantiate and call the student's class like this:

Solution solution = new Solution();

and then call the required method.

Only the runner should be public:

public class Main


============================================================
6. JAVA STUDENT STRUCTURE
============================================================

The Java boilerplate must define the expected class and method.

Example:

class Solution {
    public int solution(int n) {
        // Write your solution here
        return 0;
    }
}

Do not use:

public class Solution

when the harness contains:

public class Main

The student's method signature must remain exactly as specified by the
question.


============================================================
7. TEST CASES
============================================================

For normal coding questions, aim for approximately 15–20 test cases.

Cover realistic and edge scenarios appropriate to the problem, such as:

- normal cases
- minimum/small values
- maximum/large values
- zero
- negative values where applicable
- empty input where applicable
- single-element input where applicable
- duplicates where applicable
- no-solution cases where applicable
- multiple-solution cases where applicable
- boundary cases

Use the same logical scenarios across all five languages.

For a very basic question, fewer carefully selected test cases are fine.


============================================================
8. OUTPUT ORDER
============================================================

If the question returns an output where ordering does not matter, use
the same kind of normalize()/compare() helper used by the Square Box
pattern.

Ordering differences must not cause false failures.

If ordering DOES matter, compare normally.


============================================================
9. EXECUTION RULES
============================================================

Every harness must:

- execute the student's function for every test case
- measure runtime for every individual test case
- catch exceptions/errors on a per-test-case basis
- never allow one failed case to terminate the complete evaluation
- continue to the next test case
- store every testcase result
- calculate the final Accepted/Wrong Answer status


============================================================
10. REQUIRED FINAL OUTPUT
============================================================

The final output MUST be exactly two logical lines:

__RESULTS__

followed by one JSON line.

The JSON schema MUST be:

{
  "status": "Accepted" | "Wrong Answer",
  "passed": <int>,
  "total": <int>,
  "testCases": [
    {
      "testCase": <int>,
      "input": <obj>,
      "expectedOutput": <val>,
      "actualOutput": <val>,
      "passed": <bool>,
      "runtime": <float ms>,
      "error": <string, only if failed>
    }
  ]
}

Do not print debugging information around the final result.

For example:

__RESULTS__
{"status":"Accepted","passed":4,"total":4,"testCases":[...]}


============================================================
11. PYTHON
============================================================

Use the exact requested function signature.

Example:

def solution(n):
    # Write your solution here
    pass

Use standard Python JSON functionality for final output.

Catch exceptions separately for each test case.


============================================================
12. JAVASCRIPT (NODEJS)
============================================================

Use the exact requested function signature.

Example:

function solution(n) {
    # Write your solution here
}

Use JSON.stringify() for the final result.

Measure each testcase separately and catch each testcase error separately.


============================================================
13. JAVA JSON OUTPUT
============================================================

Do not add external JSON dependencies.

Since Java has no general-purpose built-in JSON serializer, hand-roll the
JSON using helper functions such as:

toJson()

The final Java runner must print:

System.out.println("__RESULTS__");
System.out.println(toJson(finalResult));

The first printed line must contain exactly:

__RESULTS__


============================================================
14. C JSON OUTPUT
============================================================

Do not add external JSON dependencies.

C has no native JSON library for this purpose, so hand-roll the output
using helper functions such as:

jsonString()
toJson()
printArrayJson()

The generated JSON must follow the required schema.


============================================================
15. C++ JSON OUTPUT
============================================================

Do not add external JSON dependencies.

Hand-roll the JSON output using helper functions such as:

toJsonString()
printVectorJson()

The generated JSON must follow the exact required schema.


============================================================
16. REFERENCE SOLUTION VS STUDENT SOLUTION
============================================================

The reference solution is shown only for context.

It MUST remain commented out.

The student implementation is the only implementation that should be
executed.

Never accidentally execute both implementations.


============================================================
17. SQUARE BOX REFERENCE PATTERN
============================================================

Use the Square Box question TXT as the reference pattern.

Follow its general structure:

TITLE
DESCRIPTION
EXAMPLES
FULL BOILERPLATE FOR ALL 5 LANGUAGES
HARNESS FOR ALL 5 LANGUAGES

Each harness should contain:

1. Commented correct/reference solution
2. //{{STUDENT_CODE}}
3. Test cases
4. normalize()/compare() when required
5. Main/execution block
6. Per-test runtime
7. Per-test exception handling
8. Results collection
9. __RESULTS__
10. One-line JSON result


============================================================
18. PROFESSIONAL PARAMETER NAMES
============================================================

Use meaningful parameter and variable names.

Do NOT unnecessarily use generic names such as:

input_val

when the actual problem concept is known.

Prefer meaningful names such as:

n
nums
target
s
array
length
sum

according to the problem.

Most importantly, preserve the parameter name given in the required
question signature.


============================================================
19. NEVER CHANGE THE REQUIRED SIGNATURE
============================================================

Do not change the student's required function/method signature.

For example, if the question specifies:

def solution(nums):

keep exactly:

def solution(nums):

If Java specifies:

public int solution(int n)

keep exactly:

public int solution(int n)

Likewise preserve the required JavaScript, C, and C++ signatures.


============================================================
20. FINAL VERIFICATION CHECKLIST
============================================================

Before generating the TXT file, verify all of the following:

[ ] Description uses direct HTML tags, not an HTML document.
[ ] Title and examples are included.
[ ] Full boilerplate comes before harness code.
[ ] Boilerplate is NOT commented out.
[ ] Reference solution in each harness IS commented out.
[ ] //{{STUDENT_CODE}} is present after the reference solution.
[ ] Languages are in Python, JavaScript, Java, C, C++ order.
[ ] Java uses non-public class Solution.
[ ] Java runner uses public class Main.
[ ] Java does not contain another public class.
[ ] Java correctly instantiates Solution.
[ ] Required student signatures are preserved.
[ ] Test cases cover appropriate normal and edge cases.
[ ] Ordering is normalized when order does not matter.
[ ] Each testcase is timed independently.
[ ] Each testcase catches its own exceptions.
[ ] One failed testcase never stops the remaining cases.
[ ] C and C++ use hand-rolled JSON.
[ ] No external JSON dependencies are added.
[ ] Final output starts with exactly __RESULTS__.
[ ] JSON follows the exact required schema.
[ ] No unnecessary debug output is printed.
[ ] Expected outputs have been verified against the reference solution.
`;

/**
 * Download prompt.txt to the user's computer
 */
export const downloadPromptTxt = () => {
  const element = document.createElement('a');
  const file = new Blob([COMBINED_PROMPT_TEXT], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = 'prompt.txt';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Copy LeetCode AI Harness Prompt to Clipboard
 */
export const copyLeetCodePromptToClipboard = async (questionData = null) => {
  let textToCopy = COMBINED_PROMPT_TEXT;

  if (questionData && questionData.title) {
    const customPromptHeader = `USER REQUEST:
Generate a complete 5-language coding assessment question TXT for LeetCode Question: "${questionData.title}"

DESCRIPTION:
${questionData.descriptionHtml || ''}

BOILERPLATE CODE:
Python: ${questionData.boilerplate?.python || ''}
JavaScript: ${questionData.boilerplate?.javascript || ''}
Java: ${questionData.boilerplate?.java || ''}
C: ${questionData.boilerplate?.c || ''}
C++: ${questionData.boilerplate?.cpp || ''}

============================================================
INSTRUCTIONS & TEMPLATE SPECIFICATION (prompt.txt)
============================================================
`;
    textToCopy = customPromptHeader + COMBINED_PROMPT_TEXT;
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    alert('AI Harness Prompt (prompt.txt) copied to clipboard! Send this prompt to AI to generate 5-language harness code.');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
};
