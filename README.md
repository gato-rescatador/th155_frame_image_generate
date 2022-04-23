## how to use this script
this is a node script, so you may need to install nodejs environment  
what we need to install:
- nodejs  
  goto https://nodejs.org/ and just download the LTS version  
  it is a setup so you dont need to do something special(but remember to ADD to PATH)  
  after finishing setup input "node -v" in command prompt, if there is a version, it is done  


- mongodb(because im too lazy so i use mongodb to search elems)  
1. goto https://www.mongodb.com/try/download/community and just download the version suitable.  
2. do as the setup finished(you can also install mongodb compass to get GUI operations)
in the command prompt, use "cd" to go to the installation dir and start mongo.exe
![./img/md/img_2.png](./img/md/img_2.png)  
there will be lots of infos, then you can use the mongosh commands
![./img/md/img_3.png](./img/md/img_3.png)  
3. input "use aocf", mongo will auto create the database.  
(i used this name "aocf" in my code as the database name, you can use what you want)  
(if you change the name, just change the dbName in the code here:)  
![./img/md/img_11.png](./img/md/img_11.png)
4. input `db.createCollection("elems")` and `"db.createCollection("motions")"`  
then what we need is done.   
![./img/md/img_4.png](./img/md/img_4.png)![./img/md/img_5.png](./img/md/img_5.png)

### modules we need
this script used following modules:   
- sharp  
- mongodb node driver  
- ~~fs(node)~~ (already built in node so you dont need to install)  
it is quite easy, just open the command prompt, cd to your working directory and input
`npm install`, as i included the package.json file.  
or you can also install manually: `npm install sharp` and `npm install mongodb`
![./img/md/img_6.png](./img/md/img_6.png)
- then the preparation is done.

### global params
- character name  
![./img/md/img_8.png](./img/md/img_8.png)  
  - it is the character you want to generate frame data.
  - we need to keep the name same as the json file.
  - e.g. we want kasen frame, we need the json file named "kasen.json" within.
- motionID and outputDir  
![./img/md/img_9.png](./img/md/img_9.png)
  - motionID is the numberID in the nut file we got.
  - nut file is from https://github.com/MathyFurret/th155-decomp
  - ![./img/md/img_10.png](./img/md/img_10.png)
  - we know the j5a is 1110 in the game.
  - (there is also some usual ID we use, i wrote them in the comment, except the C series which is skillA/B/C... but not 2c/5c/8c or what. so the comment is not fully correct)
  - outputDir is the output directory name, the image we get will be named by it.
  - just name it as you want. e.g. j5a, ja or what.
- Offset and width/height  
  ![./img/md/img_12.png](./img/md/img_12.png)
  - this change the width and height of output image.
  - e.g. the ichirin j8a, it is quite big, what we got is this.
  ![./img/md/img_13.png](./img/md/img_13.png)
  - it is terrible. so we change the height and width.
  ![./img/md/img_14.png](./img/md/img_14.png)
  - then we got this.  
  ![./img/md/img_15.png](./img/md/img_15.png)
  - good.
  - if you set them to 0, the file output will use the default solution of original image.  
### input the frame data to mongodb
edit the character name you want, and put the json file in.  
![./img/md/img_16.png](./img/md/img_16.png)  
![./img/md/img_17.png](./img/md/img_17.png)  
i used the two functions to input the data, to quickly search the elem we need (im lazy whatever):  
`async function updateElem()` and `async function updateMotion()`  
just cancel the comment and run the function.(remember to comment the main function)
![./img/md/img_7.png](./img/md/img_7.png)
then run the script, in the command prompt, use
`node box.js`
you will see this:  
![./img/md/img_18.png](./img/md/img_18.png)  
that is we put all the elements and motions into the database.
then we can use them to generate image.
### generate the image
- preparing the image.
  - put your source image(you can get them by touhouSE) in the working directory:  
  ![./img/md/img_19.png](./img/md/img_19.png)  
  ![./img/md/img_20.png](./img/md/img_20.png)  
  - (if you do not have the actor fir, you could get the actor dir by touhouSE.)    
  ![./img/md/img_21.png](./img/md/img_21.png)  
- set the motion you want to get
  1. change the motion you want to use.
  e.g. kasen j5a.  
  ![./img/md/img_22.png](./img/md/img_22.png)  
  ![./img/md/img_23.png](./img/md/img_23.png)  
  2. and just run the script  
  ![./img/md/img_24.png](./img/md/img_24.png)
  3. check the output dir  
  ![./img/md/img_25.png](./img/md/img_25.png)
  shit, finally!
  4. if you want to change the solution, just edit the width/height, the x/y Offset param.  
### problems im going to solve
  you know, some motions do not have only one layer, e.g. ichirin j8a.  
  whatever, the script do not distinguish the correct layer itself.
  and then we got...  
  ![./img/md/img_26.png](./img/md/img_26.png)
  WT** is this?
  obviously, it is because the location information of layer of other elements(e.g. the hand of unzan)
  and i just use the collision/hurt/hit box info of the first layer.  
  ![./img/md/img_27.png](./img/md/img_27.png)  
  so i would continue to change the code, maybe i could manually check which layer is correct.
  for now, the solution i used is directly filter the irrelevant layer. e.g.:

    if (elem['path'].toLowerCase().includes('effect')) continue;
    if (elem['path'].toLowerCase().includes('unzan')) continue;
    if (elem['path'].toLowerCase().includes('hand')) continue;
    if (elem['path'].toLowerCase().includes('head')) continue;
    if (elem['path'].toLowerCase().includes('ball')) continue;
    if (elem['path'].toLowerCase().includes('test')) continue;
    if (elem['path'].toLowerCase().includes('skill_cushion0')) continue;
    
  ![./img/md/img_28.png](./img/md/img_28.png)
  it is quite dirty...but it works indeed, just like my code, lol.
  the result is:  
  ![./img/md/img_29.png](./img/md/img_29.png)
  whatever, ok.  
  im too lazy so the code is very dirty and inelegant, 
  maybe i will change the code slowly. but if it helps you,
  i will feel quite honored. thanks.

  
  