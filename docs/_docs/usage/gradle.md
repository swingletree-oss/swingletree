---
title: Gradle
permalink: /docs/gradle/
redirect_from: /docs/index.html
---

Sonar Scanner plugins for Build Management tools like Gradle offer configuration properties to set extra scanner properties:

```gradle
sonarqube {
    properties {
        property "sonar.analysis.commitId", commitId
        property "sonar.analysis.repository", repository
    }
}
```