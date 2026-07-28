Set WshShell = CreateObject("WScript.Shell")
ScriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c cd /d """ & ScriptDir & "\server"" && npm run dev", 0, False
WshShell.Run "cmd /c cd /d """ & ScriptDir & "\client"" && npm run dev", 0, False
