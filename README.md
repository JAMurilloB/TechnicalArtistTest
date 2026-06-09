# TechnicalArtistTest
Technical Artist Test

Main Scene:

Creamos una escena que funciona como selector de las escenas específicas para los test A, B y C.
Añadimos un Background a la escena.
Y creamos un layout que alinee horizontalmente los 3 botones que hemos preparado para acceder a las escenas test.
Creamos un empty que contendrá el cc.Button y un script para controlar el funcionamiento del botón, incluyendo un efecto hover.
Como hijos contienen un sprite para los iconos diseñados para cada botón, un label y un sprote con un fondo para el label.
Adicionalmente se añade un ExitButton que cierra la pestaña del navegador.



TestA Scene:

A partir del vídeo de referencia debemos crear en photoshop los assets necesarios y recrear el botón Autoplay.
Preparamos los assets de forma individual para crear correctamente las capas en el editor de Cocos.
Añadimos un Background a la escena.
Creamos un Empty que funcionará como nuestro SpinWidget.
Nuestro SpinWidget contiene los assets gráficos.
Añadimos el GreenButton también como hijo del Widget. Y el AutoplaySymbol como hijo del GreenButton.
Incluimos una capa Sprite con un sprite blanco para añadirle un shader.
El GreenButton contiene un cc.Button y un script básico para que, al pulsarlo, haga girar el AutoplaySymbol.
El BurstEffect contiene un material M_Plasma y script básico que reacciona al hacer hover o clic al GreenButton, mostrando un efecto de rayo y burst semejante al del vídeo de referencia.
Por último añadimos un BackButton para volver a la escena Main. Se trata de un Prefab que reutilizaremos en las otras escenas Test.
Nota: se crea la animación del BackButton a mano con un SpriteSheet y su respectivo .plist.



TestB Scene:

Debemos recrear como escena el emoji.psd, habiendo extraído los assets necesarios, y haciendo uso de la fuente proporcionada, así como unas fuentes bitmap adicionales.
Añadimos un Background a la escena.
Creamos distintos Empty que servirán de contenedor para distintos propósitos. BrackgroundBottomInfo, SlotMachineWidget, MaskReels, Ui...
En SlotMachineWidget establecemos la lógica de programación de los rodillos y símbolos y añadimos los assets gráficos correspondientes para el Marco, Rodillos y Fondo de los mismos, así como la Palanca, que hemos separado previamente.
Creamos un Empty (MaskReels) para almacenar los Reels y los Symbols, y que estos queden correctamente enmascarados (no sobresalgan del espacio predeterminado para el slot).
Los Reels (Prefab) están en el interior de un Empty con su cc.Layuout para organizarlos horizonatalmente. Contienen sus symbolos que cambiamos por código.
Añadimos una capa con un cc.Graphics que nos permite mostrar un rayo cuando alineamos 3 o más emojis.

En UI establecemos los espacios para la información superior y la inferior.
La UI también contiene el Prefab del BackButton.
La BottomBar contiene un SpinButton (Prefab) con un script para comunicarse con el SlotMachineWidget y activar jugadas de forma automática.
Tenemos distribuidos diversos Prefabs que contienen sus gráficos y label para los value.

Nota: La palanca también es funcional, con una animación por tween para simular que ha sido accionada.



TestC Scene:

Debemos una pequeña pantalla para establecer el movimiento de un personaje, collectible, parallax y shader.
Creamos unos Prefabs para la Key, Player y AlienStatue.
Preparamos un Background con sus capas y un Foreground para otro de los assets de fondo.
Establecemos una capa Ground donde colocamos nuestros sprites de suelo que tendrán preaprado un RigidBody Static y sus BoxCollider2D.
El Prefab AlienStatue está preparado con sus capas y, adicionalmente, una capa glow para añadir un script controlador y un material que simula una columna de energía. El Triangle contiene un script controlador que modifica su tamaño. Ambos reaccionan al recoger la Key.
La Key tiene RigidBody2D y BoxCollider2D además de un script Controlador para eliminarla al recogerla y emitir una señal.
La Key contienen una capa "Glow" para añadir un shader de brillo azul por detrás de la Key.
La Key contiene su animación idle (a partir de frames) en una capa sprite que, además, tiene un Material y Shader para eliminar el fondo negro y generar la transparencia.
El Player Funciona igual que la Key, contiene el RigidBody2D, el BoxCollider2D y el script controlador, además de un script para generar un Respawn del personaje al salir de la pantalla.
El movimiento del Player activa el parallax del fondo.
La capa Sprite del Player contiene las animaciones y el mismo Material y Shader para eliminar el fondo negro y generar la transparencia.
La UI contiene el Prefab del BackButton.

Bonus: se han convertido las animaciones de la Key y el Player a .jpg para luego aplicar un material y shader que eliminan el fondo negro.
Bonus: se ha optmizado la imagen VIKING.png convirtiéndola a .jpg

Nota:
Se ha empleado la IA para crear scripts y shaders.
Se ha empleado la IA para crear un .py para optimizar el VIKING.png
Se añade enlace para probar directamente el Test desde GitHub

https://jamurillob.github.io/TechnicalArtistTest/


