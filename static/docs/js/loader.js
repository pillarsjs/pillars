(function(t){function e(t,e){var n,a,r;return a=!1,"function"==typeof t?(t(),e(),!0):(r=t.replace(/\?.*$/i,"").split(".").pop(),"js"==r?(n=document.createElement("script"),n.type="text/javascript",n.src=t):(n=document.createElement("link"),n.rel="stylesheet",n.type="text/css",n.href=t),n.onload=n.onreadystatechange=function(){a||this.readyState&&"complete"!=this.readyState||(a=!0,e())},void document.getElementsByTagName("head")[0].appendChild(n))}function n(){var t=this,e=[];t.data={},t.add=function(n){var a=Array.prototype.slice.call(arguments).slice(1);return e.push({func:n,args:a}),t},t.pull=function(){e.length>0&&e[0].func.apply(t,e[0].args)},t.next=function(){e.shift(),t.pull()}}function a(){var t=this,e=[],n=0;t.data={},t.add=function(n){var a=Array.prototype.slice.call(arguments).slice(1);return e.push({func:n,args:a}),t},t.pull=function(){for(var n=0,a=e.length;a>n;n++)e[n].func.apply(t,e[n].args)},t.done=function(){n++,e.length===n&&"function"==typeof t.finish&&t.finish()}}var r=!1;document.onload=document.onreadystatechange=function(){if(!(r||this.readyState&&"complete"!=this.readyState)){for(var o=new n,c=function(t){for(var n=new a,r=0,c=t.length;c>r;r++)n.add(e,t[r],n.done);n.finish=o.next,n.pull()},i=0,l=t.length;l>i;i++)o.add(c,t[i]);o.pull()}}})([
	[
		'/pillars/css/pillarsDocs.css',
		'http://fonts.googleapis.com/css?family=Inconsolata:400,700|Source+Sans+Pro:400,400italic,700,700italic',
		'http://maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css',
	],[
		'https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js',
		'/pillars/docs/js/highlight/styles/monokai.css'
	],[
		function(){
			var mainmenu = $('#mainmenu');
			var swrp = $('<div class="select"></div>');
			var select = $('<select onchange="window.open(this.value, \'_self\');"></select>');
			swrp.append(select);
			$('h2',mainmenu).after(swrp);
			$('a',mainmenu).each(function(i,e){
				var e = $(e);
				var lvl = e.parents('ul').length;
				var href = e.attr('href');
				var selected = window.location.pathname.indexOf(href)===0?' selected="selected" ':'';
				var space = '';
				if(lvl>1){
					for(var i=1;i<lvl;i++){
						space+='-';
					}
					space+='&nbsp;';
				}
				select.append('<option value="'+href+'"'+selected+'>'+space+e.text()+'</option>');
			});
		},
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
			var count = 0;
			$('#contents h2, #contents h3').each(function(i,e){
				count++;
				var e = $(e);
				var t = e.prop('tagName').toLowerCase();
				var href = '#'+e.attr('id');
				var selected = (window.location.hash).indexOf(href)===0?' selected="selected" ':'';
				var space = '';
				if(t=='h2'){
					last = $('<li></li>');
					last.append('<a href="'+href+'">'+e.html()+'</a>');
					ul.append(last);
				} else {
					if(!last.has( "ul" ).length){
						last.append('<ul></ul>');
					}
					$('ul',last).append('<li><a href="'+href+'">'+e.html()+'</a></li>');
					space = '- ';
				}
				select.append('<option value="'+href+'"'+selected+'>'+space+e.text()+'</option>');
			});
			if(!count){
				TOC.hide();
			}
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
				var href = e.attr('href');
				var selected = (window.location.pathname).indexOf(href)===0?' selected="selected" ':'';
				var space = '';
				if(lvl>1){
					for(var i=1;i<lvl;i++){
						space+='-';
					}
					space+='&nbsp;';
				}
				select.append('<option value="'+href+'"'+selected+'>'+space+e.text()+'</option>');
			});
		}
	]
]);