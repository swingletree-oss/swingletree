---
title: General
permalink: /docs/home/
redirect_from: /docs/index.html
mermaid: true
---

Welcome to the Swingletree documentation.

Please use the navigation to left to pick a section of your interest.

## Swingletree Workflow

<div class="mermaid">
    graph TD
    subgraph CI Build
      A(Report A)
      B(Report B) 
      C(Report C)
      tool(Tool A)
      yoke[yoke cli]
    end
    
    gh(GitHub)
    elastic(ElasticSearch)
    swing[Swingletree]
    
    A --collect--> yoke
    B --collect--> yoke
    C --collect--> yoke
    
    yoke --report--> swing
    tool --report--> swing
    
    swing --> gh
    swing --> elastic
</div>