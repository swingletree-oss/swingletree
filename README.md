# Swingletree

Utilize SonarQube Quality Gates inside your GitHub Pull Requests.

## Intention

Tracking your code quality across you branches is a good thing - especially when it comes to approving pull requests.

Swingletree gives you the possibility to automatically block pull requests on failing quality gates performed by the SonarQube branch plugin.

## Integration

Swingletree integrates into SonarQube using webhooks. No need to install and update plugins on your SonarQube instance.

![Activity Diagram](http://www.plantuml.com/plantuml/png/5SqnZW8n34RXVa-n781OI1I8QgvY4YjZAOaZ-myZRizGlTTzMu0TgxU_Y_Pfvthxtu4PJoBd8rN5lbuhnBCDo43AradSpU-t1yMXepQ1Yr3dW3WLoq6SeM_5vrgKgtDFysTiCihPBm00)

Swingletree integrates itself as a GitHub App, which spares you some configuration work. You will only need to install Swingletree as a GitHub App on your GitHub organization.

Swingletree will request a permission to modify your repositories' commit statuses.

> ![Commit Status](./docs/commit-status.png)


## Installation

This section covers the prerequisites and the installation of Swingletree. If you want to run Swingletree as a Docker container you can skip to the section [Running with Docker](#running-with-docker) 

### Prerequisites

* NodeJS 8 or later
* A redis database

## Configuration

## Run

### Running with Docker
