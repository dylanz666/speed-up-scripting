# speed-up-scription

## Features
### 1. scripting.initConfiguration.
* Initialize configuration.json to {}.
* command: ctrl+cmd+0 for mac and ctrl+0 for windows.

### 2. scripting.simplelyRenderCase.
* Render automation case by put testit key info to a fixed template.
* Allow cancel the action when user hit the esc key.
* command: ctrl+cmd+1 for mac and ctrl+1 for windows.

### 3. scripting.inheritFromMostSimilarCase.
* Inherit from most similar automated case for current case, items to determine similarity: preconditions, steps.
* Final similarity = (preconditions similarity + steps similarity)/2.
* Allow cancel the action when user hit the esc key.
* command: ctrl+cmd+2 for mac and ctrl+2 for windows.

### 4. scripting.getTopSimilarCases.
* Get top 5 similar cases for current's case based on case searching condition.
* Allow cancel the action when user hit the esc key.
* command: ctrl+cmd+3 for mac and ctrl+3 for windows.

### 5. scripting.getAllAutomatedCases.
* Get all automated cased from local files.
* Allow cancel the action when user hit the esc key.
* command: ctrl+cmd+4 for mac and ctrl+4 for windows.

### 6. scripting.getNotMarkedAsAutomatedCases.
* Get cases that is automated in local but is not marked as automated on testit.
* Allow cancel the action when user hit the esc key.
* command: ctrl+cmd+5 for mac and ctrl+5 for windows.

### 7. scripting.replaceKeyInfoForCase.
* Replace keyInfo for current case.
* Allow cancel the action when user hit the esc key.
* command: ctrl+cmd+6 for mac and ctrl+6 for windows.

## Requirements
None

## Extension Settings
None

## Known Issues
None

## How to package and install the extension?
1. If you don't install vsce package, then install vsce first:
```
npm install -g vsce
```

2. Package extension:
```
npm run extension:package
```

3. Install extension:
```
npm run extension:install
```

## Release Notes

### 1.0.0
1. Implement scripting.initConfiguration.
2. Implement scripting.simplelyRenderCase.
3. Implement scripting.inheritFromMostSimilarCase.
4. Implement scripting.getTopSimilarCases.
5. Implement scripting.getAllAutomatedCases.
6. Implement scripting.getNotMarkedAsAutomatedCases.
7. Implement scripting.replaceKeyInfoForCase.
8. Configure editor menus for above 7 commands.
9. Improve user experience to allow cancel the actions.
10. Improve user experience to popup function indicator before execute the commands.
11. Make it able to package the extension and install the extension via npm script.
12. Refactor the source code.
13. Add and update README.md.

-----------------------------------------------------------------------------------------------------------
### For more information

* [Extension Development Guideline - Chinese Version](https://www.bookstack.cn/read/CN-VScode-Docs/md-%E6%89%A9%E5%B1%95-%E6%A6%82%E8%BF%B0.md)
* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
* [npm module: string-similarity](https://github.com/aceakash/string-similarity#readme)
* [npm module: innertext](https://github.com/revin/innertext#readme)

**Enjoy!**