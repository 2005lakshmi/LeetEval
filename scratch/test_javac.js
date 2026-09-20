const { executeRawBenchmarkCode } = require('../backend/src/services/judge0Service');

async function testBenchmark() {
  console.time('executeRawBenchmarkCode Java');
  const res = await executeRawBenchmarkCode({
    language: 'java',
    code: 'public class Main { public static void main(String[] args){ System.out.println("OK"); } }'
  });
  console.timeEnd('executeRawBenchmarkCode Java');
  console.log('Result:', res);
}

testBenchmark();
