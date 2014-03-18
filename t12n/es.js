
general:{
	welcome:{ // genre, num
		'genre=="female" && num==1':'Bienvenida',
		'genre=="female"':'Bienvenidas todas vosotras que sois %(num)s',
		'num>1':'Bienvenidos',
		'default':'Bienvenido'
	},
	goobye:{ // genre, num
		'genre=="female" && num==1':'Chao chica',
		'genre=="female"':'Chao %(num)s chicas',
		'num>1':'chao tios',
		'default':'chao tio'
	},
	logout:"Salir y cerrar sesión",
	error:"Ha ocurrido un error: %(error)s",
	you_have_new_messages:["Tienes un mensaje nuevo","Tienes %s mensajes nuevos"],
	actionbutton:function(){ // context, action, num
		if(context=="post"){
			if(action=="new"){
				if(num==1){
					return "Crear un Post";
				} else if(num>1){
					return "Crear %(num)s Posts";
				}
			}
		}
	}
},
"clasical basic":"Formato clasico",
"clasical %s here %s ...":"%s clasica aqui %s ...",
"You have 1 message":["Tienes un mensaje","Tienes %s mensajes"],
"You no have messages":["No tienes mensajes","Tienes un mensaje","Tienes %s mensajes"]
