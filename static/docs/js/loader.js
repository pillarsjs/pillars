(function(t){function e(t,e){var n,a,r;return a=!1,"function"==typeof t?(t(),e(),!0):(r=t.replace(/\?.*$/i,"").split(".").pop(),"js"==r?(n=document.createElement("script"),n.type="text/javascript",n.src=t):(n=document.createElement("link"),n.rel="stylesheet",n.type="text/css",n.href=t),n.onload=n.onreadystatechange=function(){a||this.readyState&&"complete"!=this.readyState||(a=!0,e())},void document.getElementsByTagName("head")[0].appendChild(n))}function n(){var t=this,e=[];t.data={},t.add=function(n){var a=Array.prototype.slice.call(arguments).slice(1);return e.push({func:n,args:a}),t},t.pull=function(){e.length>0&&e[0].func.apply(t,e[0].args)},t.next=function(){e.shift(),t.pull()}}function a(){var t=this,e=[],n=0;t.data={},t.add=function(n){var a=Array.prototype.slice.call(arguments).slice(1);return e.push({func:n,args:a}),t},t.pull=function(){for(var n=0,a=e.length;a>n;n++)e[n].func.apply(t,e[n].args)},t.done=function(){n++,e.length===n&&"function"==typeof t.finish&&t.finish()}}var r=!1;document.onload=document.onreadystatechange=function(){if(!(r||this.readyState&&"complete"!=this.readyState)){for(var o=new n,c=function(t){for(var n=new a,r=0,c=t.length;c>r;r++)n.add(e,t[r],n.done);n.finish=o.next,n.pull()},i=0,l=t.length;l>i;i++)o.add(c,t[i]);o.pull()}}})([
	[
		//'/pillars/css/normalize.min.css',
		//'/pillars/css/pillars.css',
		//'/pillars/css/pillarsDocs.css',
		'http://fonts.googleapis.com/css?family=Inconsolata:400,700|Source+Sans+Pro:400,400italic,700,700italic',
		'http://maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css',
	],[
		'https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js',
		'/pillars/docs/js/highlight/styles/monokai.css'
	],[
		function(){
			var TOC = $('#TOC');
			var swrp = $('<div class="select"></div>');
			var select = $('<select onchange="window.open(this.value, \'_self\');"></select>');
			var ul = $('<ul></ul>');
			swrp.append(select);
			TOC.append('<h2>Table of contents</h2>');
			TOC.append(swrp);
			TOC.append(ul);
			var last = false;
			$('#contents h2, #contents h3').each(function(i,e){
				var e = $(e);
				var t = e.prop('tagName').toLowerCase();
				console.log(t);
				if(t=='h2'){
					last = $('<li></li>');
					last.append('<a href="#'+e.attr('id')+'">'+e.html()+'</a>');
					ul.append(last);
					select.append('<option value="#'+e.attr('id')+'">'+e.text()+'</option>');
				} else {
					if(!last.has( "ul" ).length){
						last.append('<ul></ul>');
						console.log('añadido ul');
					}
					$('ul',last).append('<li><a href="#'+e.attr('id')+'">'+e.html()+'</a></li>');
					select.append('<option value="#'+e.attr('id')+'">- '+e.text()+'</option>');
				}
			});
		},
		function(){
			var scopelinks = $('#scopelinks');
			var swrp = $('<div class="select"></div>');
			var select = $('<select onchange="window.open(this.value, \'_self\');"></select>');
			swrp.append(select);
			$('h2',scopelinks).after(swrp);
			$('a',scopelinks).each(function(i,e){
				var e = $(e);
				var lvl = e.parents('ul').length;
				var space = '';
				if(lvl>1){
					for(var i=1;i<lvl;i++){
						space+='-';
					}
					space+='&nbsp;';
				}
				select.append('<option value="'+e.attr('href')+'">'+space+e.text()+'</option>');
			});
		}
	]
]);