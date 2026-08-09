const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserAdmin = require('../models/UserAdmin');
const Question = require('../models/Question');
const Paper = require('../models/Paper');

async function autoSeedMaster(
  masterEmail = process.env.MASTER_EMAIL || 'master@platform.com',
  masterPassword = process.env.MASTER_PASSWORD || 'Master@123456',
  masterName = process.env.MASTER_NAME || 'Master Administrator'
) {
  try {
    const email = masterEmail.toLowerCase().trim();
    let master = await UserAdmin.findOne({ email });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(masterPassword, salt);

    if (!master) {
      master = await UserAdmin.create({
        name: masterName,
        email,
        passwordHash,
        role: 'master',
        status: 'approved'
      });
      console.log(`[Auto-Seed]: Created Master Admin account (${email})`);
    } else {
      master.passwordHash = passwordHash;
      master.role = 'master';
      master.status = 'approved';
      await master.save();
      console.log(`[Auto-Seed]: Synced & Verified Master Admin password (${email})`);
    }

    // Seed Demo Question: Two Sum
    let q1 = await Question.findOne({ title: 'Two Sum' });
    if (!q1) {
      q1 = await Question.create({
        title: 'Two Sum',
        descriptionHtml: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p><p>You may assume that each input would have <b>exactly one solution</b>.</p>`,
        difficulty: 'Easy',
        hints: ['Use a hash map to store complements.'],
        boilerplate: {
          python: `def solution(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n`,
          javascript: `function solution(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}\nmodule.exports = { solution };\n`
        },
        sampleTestcases: [
          { input: '[[2,7,11,15], 9]', expectedOutput: '[0,1]' },
          { input: '[[3,2,4], 6]', expectedOutput: '[1,2]' }
        ],
        hiddenTestcases: [
          { input: '[[3,3], 6]', expectedOutput: '[0,1]' },
          { input: '[[1,5,8,3], 13]', expectedOutput: '[1,2]' }
        ],
        referenceSolutionVerified: true,
        createdBy: master._id
      });
      console.log('[Auto-Seed]: Created demo question "Two Sum"');
    }

    // Seed Demo Question: Palindrome Number
    let q2 = await Question.findOne({ title: 'Palindrome Number' });
    if (!q2) {
      q2 = await Question.create({
        title: 'Palindrome Number',
        descriptionHtml: `<p>Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a palindrome integer, and <code>false</code> otherwise.</p>`,
        difficulty: 'Easy',
        hints: ['Negative numbers are never palindromes.'],
        boilerplate: {
          python: `def solution(x):\n    s = str(x)\n    return s == s[::-1]\n`,
          javascript: `function solution(x) {\n    const s = String(x);\n    return s === s.split('').reverse().join('');\n}\nmodule.exports = { solution };\n`
        },
        sampleTestcases: [
          { input: '121', expectedOutput: 'true' },
          { input: '-121', expectedOutput: 'false' }
        ],
        hiddenTestcases: [
          { input: '10', expectedOutput: 'false' },
          { input: '12321', expectedOutput: 'true' }
        ],
        referenceSolutionVerified: true,
        createdBy: master._id
      });
      console.log('[Auto-Seed]: Created demo question "Palindrome Number"');
    }

    // Seed Demo Paper
    let paper = await Paper.findOne({ title: 'Data Structures & Algorithms - Batch 1' });
    if (!paper) {
      paper = await Paper.create({
        title: 'Data Structures & Algorithms - Batch 1',
        createdBy: master._id,
        questionIds: [q1._id, q2._id],
        orderingMode: 'fixed',
        timeLimitMinutes: 45
      });
      console.log('[Auto-Seed]: Created demo paper');
    }

    console.log('[Auto-Seed]: Complete!');
  } catch (err) {
    console.error('[Auto-Seed Warning]:', err.message);
  }
}

if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leet_eval';
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 }).then(() => {
    autoSeedMaster().then(() => process.exit(0));
  });
}

module.exports = { autoSeedMaster };
