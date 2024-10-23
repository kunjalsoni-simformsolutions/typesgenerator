import * as vscode from "vscode";

let typeName = "MyTypes";
let nestedInterfaces = "";
let nestedInterfaceCount = 1;

function getObjectPropertyString(string: string) {
  const arr = string
    .split(
      /,(?=(?:[^"]|"[^"]*")*$)(?=(?:[^']|'[^']*')*$)(?=(?:[^`]|`[^`]*`)*$)/
    )
    .map((element) => {
      // Remove leading and trailing brackets
      element = element.replace(/^\s*\(/, "").replace(/^\s*\{/, "");
      element = element.replace(/\)\s*$/, "").replace(/\}\s*$/, "");
      return element.trim();
    });
  return arr;
}

function getPropsArray(string: string) {
  const arr = string.split(/,(?![^\[]*\])(?![^{]*})/).map((element) => {
    // Remove leading and trailing brackets
    element = element.replace(/^\s*\(/, "").replace(/^\s*\{/, "");
    element = element.replace(/\)\s*$/, "").replace(/\}\s*$/, "");
    return element.trim();
  });
  return arr;
}

function getPropDetail(string: string, splitCharacter: string = "=") {
  const propData = string.split(splitCharacter);
  let key = propData[0]?.trim();
  let value = propData[1]?.trim();

  return value === undefined && key.includes(":")
    ? {
        key: propData[0]?.trim().split(":")[0]?.trim(),
        value: propData[0]?.trim().split(":")[1]?.trim(),
      }
    : {
        key,
        value,
      };
}

function getPropType(
  string: string | undefined
  // addSemiColon: boolean = true
): string {
  let returnType =
    "; // TODO- Could not auto determine type. Please add type manually";
  if (string !== undefined) {
    if (string.includes("[")) {
      let newString: string = string.replace(/^\[|]$/g, "");
      const firstElement = newString.split(
        /,(?=(?:[^"']*"[^"]*")*[^"]*$)(?=(?:[^`]*`[^`]*`)*[^`]*$)(?=(?:[^{}]*{[^{}]*})*[^{}]*$)/
      )[0];

      if (firstElement) {
        returnType = `${getPropType(firstElement.toString())}[]`;
      }
    } else if (string.includes("{") && !string.includes("${")) {
      const fileContent = generateNestedInterface(string ?? "");
      returnType = `MyInterface${nestedInterfaceCount}`;
      nestedInterfaces = nestedInterfaces + fileContent;
      nestedInterfaceCount += 1;
    } else if (
      string.includes('"') ||
      string.includes("'") ||
      string.includes("`")
    ) {
      returnType = "string";
    } else if (string.includes("true") || string.includes("false")) {
      returnType = "boolean";
    } else if (`${Number(string)}` !== "NaN") {
      returnType = "number";
    }
  }
  return returnType;
}

function generateFileContent(text: string, selectedPropsOnly: boolean) {
  const propsArray = getPropsArray(
    text.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
  );
  let fileContent = selectedPropsOnly ? "" : `export interface ${typeName} {\n`;
  propsArray.forEach((prop) => {
    const propData = getPropDetail(prop);
    if (propData.key && !propData.key.includes("...")) {
      const propType = getPropType(propData.value);
      fileContent = fileContent + `  ${propData.key}: ${propType};\n`;
    }
  });
  fileContent = fileContent + (selectedPropsOnly ? "" : `}\n`);
  return fileContent;
}

function generateNestedInterface(text: string) {
  const propsArray = getObjectPropertyString(text);
  let fileContent = `export interface MyInterface${nestedInterfaceCount} {\n`;
  propsArray.forEach((prop) => {
    const propData = getPropDetail(prop, ":");
    if (propData.key && !propData.key.includes("...")) {
      const propType = getPropType(propData.value);
      fileContent = fileContent + `  ${propData.key}: ${propType}\n`;
    }
  });
  fileContent = fileContent + `}\n\n`;
  return fileContent;
}

function findLastBlankLine(
  editor: vscode.TextEditor,
  startPosition: vscode.Position
) {
  let lastBlankLine: vscode.Position | null = null;
  for (let line = startPosition.line - 1; line >= 0; line--) {
    const lineText = editor?.document.lineAt(line).text;
    if (lineText?.trim() === "") {
      lastBlankLine = new vscode.Position(line, 0);
      break;
    }
  }
  return lastBlankLine;
}

function findLastImportLine(editor: vscode.TextEditor) {
  let lastImportLine: vscode.Position | null = null;
  for (let line = editor.document.lineCount - 1; line >= 0; line--) {
    const lineText = editor?.document.lineAt(line).text;
    if (lineText?.includes("import ")) {
      lastImportLine = new vscode.Position(line + 1, 0);
      break;
    }
  }
  return lastImportLine;
}

function insertTextAfterImports(
  editor: vscode.TextEditor,
  fileContent: string,
  lastImportLine: vscode.Position | null
) {
  if (lastImportLine) {
    editor
      ?.edit((editBuilder) => {
        const textToInsert = `\n${fileContent}\n`;
        editBuilder.insert(lastImportLine, textToInsert);
      })
      .then((success) => {
        if (success) {
          vscode.window.showInformationMessage(
            "Text inserted after the last import line."
          );
        } else {
          vscode.window.showErrorMessage("Failed to insert text.");
        }
      });
  }
}

function insertTextAtLastBlankLine(
  editor: vscode.TextEditor,
  fileContent: string,
  lastBlankLine: vscode.Position | null
) {
  if (lastBlankLine) {
    editor
      ?.edit((editBuilder) => {
        const textToInsert = `\n${fileContent}`;
        editBuilder.insert(lastBlankLine!, textToInsert);
      })
      .then((success) => {
        if (success) {
          vscode.window.showInformationMessage(
            "Text inserted at the last blank line."
          );
        } else if (findLastImportLine(editor)) {
          insertTextAfterImports(
            editor,
            fileContent,
            findLastImportLine(editor)
          );
        }
      });
  }
}

function generateTypes(
  generateInSameFile: boolean = false,
  selectedPropsOnly: boolean = false
) {
  nestedInterfaceCount = 1;
  let propsString = "";
  nestedInterfaces = "";
  typeName = "";
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;
  const text = editor?.document.getText(selection);
  const startPosition = selection?.start;

  const isNameSelected =
    !selectedPropsOnly &&
    !(
      text?.includes("\n") ||
      text?.includes(" ") ||
      text?.includes("=") ||
      text?.includes(",")
    );

  if (isNameSelected) {
    let documentText = editor?.document.getText() ?? "";

    // Get the line number of the selection
    const lineNumber = selection?.start.line;

    // Get the lines above the selection
    const allLines = documentText.split("\n");

    const lines = allLines.slice(lineNumber, allLines.length - 1);

    for (const line of lines) {
      // Remove comments from the line
      const uncommentedLine = line
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\*\*[\s\S]*?\*\//g, "")
        .trim();

      const regex = /\(\s*\n*\{((?:[^{}]|{[^{}]*}|}[^{}]*)*)\}/;

      const index = documentText.indexOf(uncommentedLine);

      const match = documentText.slice(index).match(regex);
      if (index !== -1) {
        if (match && match.length >= 2) {
          propsString = match[1];
          typeName = (text && text.length > 0 ? text : "MyGenerated") + "Types";
          break;
        }
      }
    }
  } else {
    propsString = text ?? "";
    typeName = "MyGeneratedTypes";

    propsString = propsString.replace(/^\s*\(/, "").replace(/^\s*\{/, "");
    propsString = propsString.replace(/\)\s*$/, "").replace(/\}\s*$/, "");
  }

  let fileContent = generateFileContent(propsString ?? "", selectedPropsOnly);
  fileContent = selectedPropsOnly
    ? fileContent
    : nestedInterfaces + fileContent;

  if (selectedPropsOnly) {
    vscode.env.clipboard.writeText(fileContent).then(() => {
      vscode.window.showInformationMessage(
        "Interface code copied to clipboard!"
      );
    });
  } else if (generateInSameFile) {
    if (editor && startPosition) {
      const lastBlankLine = findLastBlankLine(editor, startPosition);
      insertTextAtLastBlankLine(
        editor,
        fileContent,
        lastBlankLine ?? new vscode.Position(0, 0)
      );
    }
  } else {
    const options = [
      { label: "Copy to clipboard" },
      { label: "Add above" },
      { label: "Create new file" },
    ];

    vscode.window.showQuickPick(options).then((selection) => {
      if (selection) {
        // User selected an option, do something with it
        console.log(`User  selected: ${selection.label}`);
        switch (selection) {
          case options[0]:
            vscode.env.clipboard.writeText(fileContent).then(() => {
              vscode.window.showInformationMessage(
                "Interface code copied to clipboard!"
              );
            });
            break;
          case options[1]:
            if (editor && startPosition) {
              const lastBlankLine = findLastBlankLine(editor, startPosition);
              insertTextAtLastBlankLine(
                editor,
                fileContent,
                lastBlankLine ?? new vscode.Position(0, 0)
              );
            }
            break;
          default:
            const fs = require("fs");

            const filePath =
              vscode.window.activeTextEditor?.document.uri.fsPath;
            if (filePath) {
              const folderPath = filePath.substring(
                0,
                filePath.lastIndexOf("/")
              );
              const fileName = filePath
                .substring(filePath.lastIndexOf("/") + 1, filePath.length - 1)
                .split(".")[0];
              const newFilePath = `${folderPath}/${fileName}Types.ts`;

              const newFileExists = fs.existsSync(newFilePath);

              const newFileContent: string = newFileExists
                ? fs.readFileSync(newFilePath, "utf8")
                : "";

              fs.appendFileSync(
                newFilePath,
                newFileContent.trim().length > 0
                  ? "\n" + fileContent
                  : fileContent,
                (err: any) => {
                  if (err) {
                    vscode.window.showErrorMessage(
                      "Eror appending in file fileName: ",
                      err
                    );
                  } else {
                    vscode.workspace
                      .openTextDocument(newFilePath)
                      .then((doc) => {
                        vscode.window.showTextDocument(doc);
                      });
                  }
                }
              );

              vscode.workspace.openTextDocument(newFilePath).then((doc) => {
                vscode.window.showTextDocument(doc);
              });
            }
        }
      } else {
        // User cancelled the selection
        console.log("User cancelled");
      }
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("typesgenerator.addTypesBlock", () =>
      generateTypes(true)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("typesgenerator.showTypesOptions", () =>
      generateTypes(false)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("typesgenerator.createExtraTypes", () =>
      generateTypes(true, true)
    )
  );
}

export function deactivate() {}
