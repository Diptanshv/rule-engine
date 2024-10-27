import { RuleEngine, NodeType, Operator, ComparisonOperator, Node } from '../ruleEngine';

const ruleEngine = new RuleEngine();

describe("RuleEngine", () => {
  describe("createRule", () => {
    it("should create a simple comparison rule", () => {
      const ruleString = "age > 18";
      const ruleAST = ruleEngine.createRule(ruleString);

      expect(ruleAST).toEqual({
        type: NodeType.COMPARISON,
        operator: ComparisonOperator.GT,
        attribute: "age",
        value: 18,
        isOptional:false,
      });
    });

    it("should create a compound rule with AND", () => {
      const ruleString = "age > 18 AND score >= 90";
      const ruleAST = ruleEngine.createRule(ruleString);

      expect(ruleAST).toEqual({
        type: NodeType.OPERATOR,
        operator: Operator.AND,
        left: {
          type: NodeType.COMPARISON,
          operator: ComparisonOperator.GT,
          attribute: "age",
          value: 18,
          isOptional:false,
        },
        right: {
          type: NodeType.COMPARISON,
          operator: ComparisonOperator.GTE,
          attribute: "score",
          value: 90,
          isOptional:false,
        },
      });
    });
  });

  describe("combineRules", () => {
    it("should combine two rules with OR", () => {
      const ruleStrings = ["age > 18", "score >= 90"];
      const combinedAST = ruleEngine.combineRules(ruleStrings);

      expect(combinedAST).toEqual({
        type: NodeType.OPERATOR,
        operator: Operator.OR,
        left: {
          type: NodeType.COMPARISON,
          operator: ComparisonOperator.GT,
          attribute: "age",
          value: 18,
          isOptional: false,
        },
        right: {
          type: NodeType.COMPARISON,
          operator: ComparisonOperator.GTE,
          attribute: "score",
          value: 90,
          isOptional: false,
        },
      });
    });
  });

  describe("evaluateRule", () => {
    it("should evaluate a rule correctly", () => {
      const rule: Node = {
        type: NodeType.COMPARISON,
        operator: ComparisonOperator.GT,
        attribute: "age",
        value: 18,
      };
      const data = { age: 20 };
      const result = ruleEngine.evaluateRule(rule, data);

      expect(result).toBe(true);
    });

    it("should evaluate a compound rule with AND", () => {
      const rule: Node = {
        type: NodeType.OPERATOR,
        operator: Operator.AND,
        left: {
          type: NodeType.COMPARISON,
          operator: ComparisonOperator.GT,
          attribute: "age",
          value: 18,
        },
        right: {
          type: NodeType.COMPARISON,
          operator: ComparisonOperator.GTE,
          attribute: "score",
          value: 90,
        },
      };
      const data = { age: 20, score: 95 };
      const result = ruleEngine.evaluateRule(rule, data);

      expect(result).toBe(true);
    });
  });

  describe("markAttributeOptional", () => {
    it("should mark an attribute as optional", () => {
      const rule: Node = {
        type: NodeType.COMPARISON,
        operator: ComparisonOperator.GT,
        attribute: "age",
        value: 18,
      };
      const updatedRule = ruleEngine.markAttributeOptional(rule, "age");

      expect(updatedRule.isOptional).toBe(true);
    });
  });
});
