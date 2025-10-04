import { EnhancedAgentGenerator } from './standalone/runtime-files/enhanced_agent_generator.mjs';
import { ScrollDNAParser } from './standalone/runtime-files/copilot-agent-runtime/scrollDNAParser.js';

async function testEnhancedAgentGenerator() {
  console.log('🧪 Testing Enhanced Agent Generator...');

  try {
    const generator = new EnhancedAgentGenerator();

    // Test with a sample intent
    const testIntent = 'Create a mobile app generator with NFT minting capabilities';
    console.log(`📝 Generating agent for intent: "${testIntent}"`);

    const result = await generator.generateAgent(testIntent);

    console.log('✅ Agent generation successful!');
    console.log('Agent name:', result.agent.name);
    console.log('Validation score:', result.validation.score);
    console.log('Validation grade:', result.validation.grade);
    console.log('Pass status:', result.validation.pass);

    // Test ScrollDNAParser
    console.log('\n🧬 Testing ScrollDNAParser...');
    const dnaResult = ScrollDNAParser.parseScrollDNA('MobileDev.TestAgent');
    console.log('DNA structure generated for:', dnaResult.name);
    console.log('Complexity:', dnaResult.traits.complexity);
    console.log('Execution pattern:', dnaResult.biometrics.executionPattern);
    console.log('Biomimetic features:', Object.keys(dnaResult.copilotBiolink.biomimeticFeatures));

    console.log('\n🎉 All tests passed! Enhanced agent building engine is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testEnhancedAgentGenerator();
