from tree_sitter import Language, Parser
import tree_sitter_python
import tree_sitter_javascript
import tree_sitter_typescript
import tree_sitter_java
import tree_sitter_go
import tree_sitter_rust
from typing import Dict, List, Optional, Any


class CodeParser:
    """Multi-language code parser using Tree-sitter"""
    
    def __init__(self):
        self.parsers = {
            "python": self._create_parser(Language(tree_sitter_python.language())),
            "javascript": self._create_parser(Language(tree_sitter_javascript.language())),
            "typescript": self._create_parser(Language(tree_sitter_typescript.language_typescript())),
            "java": self._create_parser(Language(tree_sitter_java.language())),
            "go": self._create_parser(Language(tree_sitter_go.language())),
            "rust": self._create_parser(Language(tree_sitter_rust.language())),
        }
        
        self.language_extensions = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".go": "go",
            ".rs": "rust",
        }
    
    def _create_parser(self, language) -> Parser:
        """Create parser for language"""
        parser = Parser(language)
        return parser
    
    def detect_language(self, file_path: str) -> Optional[str]:
        """Detect language from file extension"""
        for ext, lang in self.language_extensions.items():
            if file_path.endswith(ext):
                return lang
        return None
    
    def parse_file(self, file_path: str, content: str, language: Optional[str] = None) -> Dict[str, Any]:
        """Parse file and extract entities"""
        if not language:
            language = self.detect_language(file_path)
        
        if not language or language not in self.parsers:
            return {
                "error": f"Unsupported language: {language}",
                "file_path": file_path,
            }
        
        parser = self.parsers[language]
        tree = parser.parse(bytes(content, "utf8"))
        root_node = tree.root_node
        
        entities = {
            "file_path": file_path,
            "language": language,
            "functions": self._extract_functions(root_node, content),
            "classes": self._extract_classes(root_node, content),
            "imports": self._extract_imports(root_node, content),
            "variables": self._extract_variables(root_node, content),
            "complexity": self._calculate_complexity(root_node),
            "code_smells": self._detect_code_smells(root_node, content),
        }
        
        return entities
    
    def _extract_functions(self, node, content: str) -> List[Dict[str, Any]]:
        """Extract function definitions"""
        functions = []
        
        def traverse(n):
            if n.type in ["function_definition", "function_declaration", "method_definition"]:
                func_name = self._get_function_name(n, content)
                if func_name:
                    functions.append({
                        "name": func_name,
                        "start_line": n.start_point[0],
                        "end_line": n.end_point[0],
                        "start_byte": n.start_byte,
                        "end_byte": n.end_byte,
                        "parameters": self._get_parameters(n, content),
                        "docstring": self._get_docstring(n, content),
                    })
            
            for child in n.children:
                traverse(child)
        
        traverse(node)
        return functions
    
    def _extract_classes(self, node, content: str) -> List[Dict[str, Any]]:
        """Extract class definitions"""
        classes = []
        
        def traverse(n):
            if n.type in ["class_definition", "class_declaration"]:
                class_name = self._get_class_name(n, content)
                if class_name:
                    classes.append({
                        "name": class_name,
                        "start_line": n.start_point[0],
                        "end_line": n.end_point[0],
                        "start_byte": n.start_byte,
                        "end_byte": n.end_byte,
                        "methods": self._get_class_methods(n, content),
                        "base_classes": self._get_base_classes(n, content),
                    })
            
            for child in n.children:
                traverse(child)
        
        traverse(node)
        return classes
    
    def _extract_imports(self, node, content: str) -> List[Dict[str, Any]]:
        """Extract import statements"""
        imports = []
        
        def traverse(n):
            if n.type in ["import_statement", "import_from_statement", "import_declaration"]:
                imports.append({
                    "statement": content[n.start_byte:n.end_byte],
                    "line": n.start_point[0],
                })
            
            for child in n.children:
                traverse(child)
        
        traverse(node)
        return imports
    
    def _extract_variables(self, node, content: str) -> List[Dict[str, Any]]:
        """Extract variable declarations"""
        variables = []
        
        def traverse(n):
            if n.type in ["variable_declaration", "assignment"]:
                var_name = self._get_variable_name(n, content)
                if var_name:
                    variables.append({
                        "name": var_name,
                        "line": n.start_point[0],
                    })
            
            for child in n.children:
                traverse(child)
        
        traverse(node)
        return variables
    
    def _calculate_complexity(self, node) -> Dict[str, int]:
        """Calculate cyclomatic complexity"""
        complexity = 1  # Base complexity
        max_nesting = 0
        
        def traverse(n, depth=0):
            nonlocal complexity, max_nesting
            
            max_nesting = max(max_nesting, depth)
            
            # Increment for control flow nodes
            if n.type in ["if_statement", "while_statement", "for_statement", 
                         "case_statement", "catch_clause", "elif_clause"]:
                complexity += 1
            
            new_depth = depth + 1 if n.type in ["if_statement", "while_statement", "for_statement"] else depth
            for child in n.children:
                traverse(child, new_depth)
        
        traverse(node)
        
        return {
            "cyclomatic_complexity": complexity,
            "max_nesting_depth": max_nesting,
        }
    
    def _detect_code_smells(self, node, content: str) -> List[Dict[str, Any]]:
        """Detect common code smells"""
        smells = []
        
        # Long functions (>50 lines)
        def check_long_functions(n):
            if n.type in ["function_definition", "function_declaration", "method_definition"]:
                lines = n.end_point[0] - n.start_point[0]
                if lines > 50:
                    func_name = self._get_function_name(n, content)
                    smells.append({
                        "type": "long_function",
                        "name": func_name,
                        "lines": lines,
                        "location": n.start_point[0],
                    })
            
            for child in n.children:
                check_long_functions(child)
        
        check_long_functions(node)
        
        # TODO: Add more smell detection (duplicated code, etc.)
        
        return smells
    
    def _get_function_name(self, node, content: str) -> Optional[str]:
        """Extract function name from node"""
        for child in node.children:
            if child.type == "identifier":
                return content[child.start_byte:child.end_byte]
        return None
    
    def _get_class_name(self, node, content: str) -> Optional[str]:
        """Extract class name from node"""
        for child in node.children:
            if child.type == "identifier":
                return content[child.start_byte:child.end_byte]
        return None
    
    def _get_variable_name(self, node, content: str) -> Optional[str]:
        """Extract variable name from node"""
        for child in node.children:
            if child.type == "identifier":
                return content[child.start_byte:child.end_byte]
        return None
    
    def _get_parameters(self, node, content: str) -> List[str]:
        """Extract function parameters"""
        params = []
        for child in node.children:
            if child.type == "parameters":
                for param in child.children:
                    if param.type == "identifier":
                        params.append(content[param.start_byte:param.end_byte])
        return params
    
    def _get_docstring(self, node, content: str) -> Optional[str]:
        """Extract docstring from function/class"""
        # Look for string literal as first statement
        for child in node.children:
            if child.type in ["block", "suite"]:
                for stmt in child.children:
                    if stmt.type in ["expression_statement", "string"]:
                        return content[stmt.start_byte:stmt.end_byte].strip('"\'')
        return None
    
    def _get_class_methods(self, node, content: str) -> List[str]:
        """Extract method names from class"""
        methods = []
        for child in node.children:
            if child.type in ["block", "class_body"]:
                for item in child.children:
                    if item.type in ["function_definition", "method_definition"]:
                        method_name = self._get_function_name(item, content)
                        if method_name:
                            methods.append(method_name)
        return methods
    
    def _get_base_classes(self, node, content: str) -> List[str]:
        """Extract base classes"""
        bases = []
        for child in node.children:
            if child.type == "argument_list":
                for arg in child.children:
                    if arg.type == "identifier":
                        bases.append(content[arg.start_byte:arg.end_byte])
        return bases


# Global instance
code_parser = CodeParser()
