# Overview

```markdown
Module Name: Michao Bidder Adapter
Module Type: Bidder Adapter
Maintainer: miyamoto.kai@lookverin.com
```

# Description

Module that connects to Michao’s demand sources

# Test Parameters

```javascript
var adUnits = [
  {
    code: "test-div",
    mediaTypes: {
      banner: {
        sizes: [[300, 250]], // a display size
      },
    },
    bids: [
      {
        bidder: "michao",
        params: {
          placement: 1,
          site: 1,
        },
      },
    ],
  },
];
```
