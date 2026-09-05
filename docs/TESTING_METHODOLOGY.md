# Testing Methodology

We combine **Storytest-Driven Development (SDD)** to codify expected software behavior with **Test-Driven Development (TDD)** to guide implementation.

## SDD: Specify behavior

Express business needs as user stories and define their acceptance criteria through concrete, testable examples. Write these examples in **Gherkin**, using the language of the user's domain, and execute them with **Cucumber**.

Each scenario describes the starting conditions, an action, and the expected results:

```gherkin
Feature: Homework submission
  As a student
  I want to submit my homework
  So that my teacher can review it

  Scenario: Submit completed homework
    Given I have completed an assignment
    When I submit my homework
    Then the assignment should be marked as submitted
    And my teacher should be able to view my submission
```

These storytests serve as executable specifications of higher-level behavior.

## TDD: Develop the implementation

Use unit tests to develop the code that fulfills those specifications:

1. Write a failing test for the next required behavior.
2. Write enough code to make it pass.
3. Refactor while keeping the tests passing.

Use whichever unit-testing tools suit the project; the methodology does not depend on a particular framework.

## Working cycle

Define a story and its acceptance scenarios before implementation. Use the TDD cycle to build the supporting code, then verify that the storytests pass. Keep both sets of tests as regression checks as the software evolves.
