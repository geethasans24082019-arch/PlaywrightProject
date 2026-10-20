Feature: Test Automation University Home Page Validation

  Background:
    Given user navigates to TAU home page

  Scenario: Verify home page loads successfully
    Then the page title should contain "Test Automation University"

  Scenario: Verify Enroll Now button is visible
    Then the Enroll Now button should be displayed

  Scenario: Verify Sign In link navigation
    When user clicks Sign In
    Then login page should be displayed

  @negative
  Scenario: Verify invalid login
    And user logs in with invalid credentials
    Then login error should be displayed

  Scenario: Verify empty login
    And user submits login without credentials

  Scenario: Verify external links return valid URLs
    Then instructor links should have valid href values

  Scenario: Verify page responsiveness
    Then homePage should render correctly on mobile view

  Scenario: Verify course count greater than zero
    Then displayed courses count should be greater than zero

  Scenario: Verify broken images are not present
    Then all visible images should be loaded successfully
