
import processing.serial.*;

Serial myPort;  // Create object from Serial class

boolean firstSample = true;

float [] RwAcc = new float[3];         //projection of normalized gravitation force vector on x/y/z axis, as measured by accelerometer
float [] Gyro = new float[3];          //Gyro readings
float [] RwGyro = new float[3];        //Rw obtained from last estimated value and gyro movement
float [] Awz = new float[2];           //angles between projection of R on XZ/YZ plane and Z axis (deg)
float [] RwEst = new float[3];

int lastTime = 0;
int interval = 0;
float wGyro = 10.0;

int lf = 10; // 10 is '\n' in ASCII
byte[] inBuffer = new byte[365];

PFont font;
final int VIEW_SIZE_X = 600, VIEW_SIZE_Y = 600;

void setup() 
{
  size(VIEW_SIZE_X, VIEW_SIZE_Y, P3D);
  myPort = new Serial(this, "/dev/tty.usbmodemfa131", 19200);
  
  // The font must be located in the sketch's "data" directory to load successfully
  font = loadFont("CourierNew36.vlw"); 
}

void readSensors() {
  if(myPort.available() > 0) {
    if (myPort.readBytesUntil(lf, inBuffer) > 0) {
      String inputString = new String(inBuffer);
      println(inputString);
      if(inputString.length() > 20) {
        String [] inputStringArr = split(inputString, ',');
      
        // convert raw readings to G
        RwAcc[0] = float(inputStringArr[0]);
        RwAcc[1] = float(inputStringArr[1]);
        RwAcc[2] = float(inputStringArr[2]);
        
        // convert raw readings to degrees/sec
        Gyro[0] = float(inputStringArr[3]);
        Gyro[1] = float(inputStringArr[4]);
        Gyro[2] = float(inputStringArr[5]);
        
        RwGyro[0] = float(inputStringArr[6]);
        RwGyro[1] = float(inputStringArr[7]);
        RwGyro[2] = float(inputStringArr[8]);
        
        Awz[0] = float(inputStringArr[9]);
        Awz[1] = float(inputStringArr[10]);
        
        //estimates
        RwEst[0] = float(inputStringArr[11]);
        RwEst[1] = float(inputStringArr[12]);
        RwEst[2] = float(inputStringArr[13]);
      }
      
    }
  }
}

void buildBoxShape() {
  //box(60, 10, 40);
  noStroke();
  beginShape(QUADS);
  
  //Z+ (to the drawing area)
  fill(#00ff00);
  vertex(-30, -5, 20);
  vertex(30, -5, 20);
  vertex(30, 5, 20);
  vertex(-30, 5, 20);
  
  //Z-
  fill(#0000ff);
  vertex(-30, -5, -20);
  vertex(30, -5, -20);
  vertex(30, 5, -20);
  vertex(-30, 5, -20);
  
  //X-
  fill(#ff0000);
  vertex(-30, -5, -20);
  vertex(-30, -5, 20);
  vertex(-30, 5, 20);
  vertex(-30, 5, -20);
  
  //X+
  fill(#ffff00);
  vertex(30, -5, -20);
  vertex(30, -5, 20);
  vertex(30, 5, 20);
  vertex(30, 5, -20);
  
  //Y-
  fill(#ff00ff);
  vertex(-30, -5, -20);
  vertex(30, -5, -20);
  vertex(30, -5, 20);
  vertex(-30, -5, 20);
  
  //Y+
  fill(#00ffff);
  vertex(-30, 5, -20);
  vertex(30, 5, -20);
  vertex(30, 5, 20);
  vertex(-30, 5, 20);
  
  endShape();
}

void drawCube() {  
  pushMatrix();
    translate(300, 450, 0);
    scale(4,4,4);
    
    rotateX(HALF_PI * -RwEst[0]);
    rotateZ(HALF_PI * RwEst[1]);
    
    buildBoxShape();
    
  popMatrix();
}

void draw() {  
  readSensors();
  
  background(#000000);
  fill(#ffffff);
  
  textFont(font, 20);
  //float temp_decoded = 35.0 + ((float) (temp + 13200)) / 280;
  //text("temp:\n" + temp_decoded + " C", 350, 250);
  text("RwAcc (G):\n" + RwAcc[0] + "\n" + RwAcc[1] + "\n" + RwAcc[2] + "\ninterval: " + interval, 20, 50);
  text("Gyro (°/s):\n" + Gyro[0] + "\n" + Gyro[1] + "\n" + Gyro[2], 220, 50);
  text("Awz (°):\n" + Awz[0] + "\n" + Awz[1], 420, 50);
  text("RwGyro (°/s):\n" + RwGyro[0] + "\n" + RwGyro[1] + "\n" + RwGyro[2], 20, 180);
  text("RwEst :\n" + RwEst[0] + "\n" + RwEst[1] + "\n" + RwEst[2], 220, 180);
  
  // display axes
  pushMatrix();
    translate(450, 250, 0);
    stroke(#ffffff);
    scale(100, 100, 100);
    line(0,0,0,1,0,0);
    line(0,0,0,0,-1,0);
    line(0,0,0,0,0,1);
    line(0,0,0, -RwEst[0], RwEst[1], RwEst[2]);
  popMatrix();
  
  drawCube();
}



