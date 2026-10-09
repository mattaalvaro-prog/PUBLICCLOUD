Add-Type -TypeDefinition @"
using System;
using System.CodeDom.Compiler;
using Microsoft.JScript;

public class JSChecker {
    public static string Check(string code) {
        JScriptCodeProvider provider = new JScriptCodeProvider();
        CompilerParameters parameters = new CompilerParameters();
        parameters.GenerateInMemory = true;
        CompilerResults results = provider.CompileAssemblyFromSource(parameters, code);
        
        if (results.Errors.HasErrors) {
            foreach (CompilerError error in results.Errors) {
                return "Error at line " + error.Line + ", column " + error.Column + ": " + error.ErrorText;
            }
        }
        return "No syntax errors found by JScript compiler.";
    }
}
"@ -ReferencedAssemblies "Microsoft.JScript"

$code = [System.IO.File]::ReadAllText("c:\Portal OPE\app.js")
[JSChecker]::Check($code)
