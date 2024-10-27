import express from 'express';
import { RuleEngine,Operator,NodeType } from './ruleEngine.js';
import { connectDB } from './db/connection.js';
import { Rule } from './models/Rule.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.static('public'));
app.use(express.json());

const ruleEngine = new RuleEngine();

// Connect to MongoDB
connectDB();
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./src/public/index.html')); // Adjust the path if your file is in a subfolder
});
app.post('/rules', async (req, res) => {
  try {
    const { ruleString, ruleName, description, optionalAttributes = [] } = req.body;
    
    if (!ruleString || !ruleName) {
      return res.status(400).json({ 
        error: 'Rule string and rule name are required' 
      });
    }

    let ruleAst = ruleEngine.createRule(ruleString);
    
    // Mark specified attributes as optional
    for (const attr of optionalAttributes) {
      ruleAst = ruleEngine.markAttributeOptional(ruleAst, attr);
    }

    // Create new rule document
    const rule = new Rule({
      name: ruleName,
      description,
      ast: ruleAst
    });

    await rule.save();

    return res.status(201).json({ 
      message: 'Rule created successfully',
      ruleName 
    });
  } catch (error:any) {
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({
        error: 'Rule with this name already exists'
      });
    }
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Invalid rule' 
    });
  }
});

app.post('/rules/combine', async (req, res) => {
  try {
    const { rules, combinedRuleName, description } = req.body;
    
    if (!Array.isArray(rules) || rules.length === 0 || !combinedRuleName) {
      return res.status(400).json({ 
        error: 'Rules array and combined rule name are required' 
      });
    }

    // Retrieve rules from MongoDB
    const ruleDocuments = await Rule.find({ 
      name: { $in: rules },
      isActive: true 
    });

    if (ruleDocuments.length !== rules.length) {
      return res.status(404).json({
        error: 'One or more rules not found'
      });
    }

    // Extract ASTs and combine
    const ruleNodes = ruleDocuments.map(doc => doc.ast);
    const combinedAst = ruleNodes.reduce((combined, current) => ({
      type: NodeType.OPERATOR,
      operator: Operator.OR,
      left: combined,
      right: current
    }));

    // Create new combined rule
    const combinedRule = new Rule({
      name: combinedRuleName,
      description,
      ast: combinedAst
    });

    await combinedRule.save();

    return res.status(201).json({ 
      message: 'Rules combined successfully',
      combinedRuleName 
    });
  } catch (error:any) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Combined rule name already exists'
      });
    }
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Error combining rules' 
    });
  }
});

app.post('/evaluate', async (req, res) => {
  try {
    const { ruleName, data } = req.body;

    if (!ruleName || !data) {
      return res.status(400).json({ 
        error: 'Rule name and data are required' 
      });
    }

    const rule = await Rule.findOne({ name: ruleName, isActive: true });
    if (!rule) {
      return res.status(404).json({ 
        error: 'Rule not found' 
      });
    }

    const result = ruleEngine.evaluateRule(rule.ast, data);
    return res.json({ result });
  } catch (error) {
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Evaluation error' 
    });
  }
});

// New endpoints for rule management

app.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find({ isActive: true })
      .select('name description createdAt updatedAt');
    return res.json(rules);
  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching rules'
    });
  }
});

app.get('/rules/:name', async (req, res) => {
  try {
    const rule = await Rule.findOne({ 
      name: req.params.name,
      isActive: true 
    });
    
    if (!rule) {
      return res.status(404).json({
        error: 'Rule not found'
      });
    }

    return res.json(rule);
  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching rule'
    });
  }
});

app.delete('/rules/:name', async (req, res) => {
  try {
    const rule = await Rule.findOne({ name: req.params.name });
    if (!rule) {
      return res.status(404).json({
        error: 'Rule not found'
      });
    }

    // Soft delete by marking as inactive
    rule.isActive = false;
    await rule.save();

    return res.json({
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error deleting rule'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
export default app;