const { executeRawBenchmarkCode } = require('../backend/src/services/judge0Service');

async function runBatchTest() {
  console.log('Testing 10 Java jobs with concurrency = 2...');
  const javaCode = 'public class Main { public static void main(String[] args){ System.out.println("OK"); } }';

  const jobs = Array(10).fill({ language: 'java', code: javaCode });
  const batchSize = 2;
  const overallStart = Date.now();

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const bStart = Date.now();
    await Promise.all(batch.map(j => executeRawBenchmarkCode(j)));
    console.log(`Batch ${i / batchSize + 1} finished in ${Date.now() - bStart} ms`);
  }

  console.log(`Total 10 Java Jobs Completed in: ${Date.now() - overallStart} ms`);
}

runBatchTest();
