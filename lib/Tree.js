
module.exports = Tree;

function Tree(){}
	Tree.prototype.parse = function treeParser(marks){
		var result = {};
		treeParseWalker([],this,result,marks);
		return result;
	};
		function treeParseWalker(path,tree,result,marks){
			for(var i=0,k=Object.keys(tree),l=k.length;i<l;i++){
				var key = k[i];
				if(tree[key] instanceof Tree){
					if(marks){result[path.concat([key]).join('.')]=true;}
					treeParseWalker(path.concat([key]),tree[key],result,marks);
				} else {
					result[path.concat([key]).join('.')]=tree[key];
				}
			}
		}