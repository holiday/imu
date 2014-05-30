#include <Wire.h>
#include "Motors.h"
#include "Kalman.h"

#define gyroAddress 0x68
#define adxlAddress 0x53

Motors motors(9, 10, 50, 2180, 4000);

Kalman kalmanX;
Kalman kalmanY;

String incomingStr;
char incomingChar;

double zeroValue[5] = {10,15,-20,56,14};

/* All the angles start at 180 degrees */
double gyroXangle = 180;
double gyroYangle = 180;

double compAngleX = 180;
double compAngleY = 180;

unsigned long timer;

void setup(){

    Serial.begin(115200);

    Wire.begin();

    i2cWrite(adxlAddress, 0x31, 0x09); // Full resolution mode
    i2cWrite(adxlAddress, 0x2D, 0x08); // Setup ADXL345 for constant measurement mode

    i2cWrite(gyroAddress, 0x16, 0x1A); // this puts your gyro at +-2000deg/sec  and 98Hz Low pass filter
    i2cWrite(gyroAddress, 0x15, 0x09); // this sets your gyro at 100Hz sample rate

    timer = micros();
}

void loop() {
    double gyroXrate = -(((double)readGyroX() - zeroValue[3]) / 14.375);
    gyroXangle += gyroXrate * ((double)(micros() - timer) / 1000000); // Without any filter

    double gyroYrate = (((double)readGyroY() - zeroValue[4]) / 14.375);
    gyroYangle += gyroYrate * ((double)(micros() - timer) / 1000000); // Without any filter

    double accXangle = getXangle();
    double accYangle = getYangle();

    compAngleX = (0.93 * (compAngleX + (gyroXrate * (double)(micros() - timer) / 1000000))) + (0.07 * accXangle);
    compAngleY = (0.93 * (compAngleY + (gyroYrate * (double)(micros() - timer) / 1000000))) + (0.07 * accYangle);

    double xAngle = kalmanX.getAngle(accXangle, gyroXrate, (double)(micros() - timer) / 1000000); // calculate the angle using a Kalman filter
    double yAngle = kalmanY.getAngle(accYangle, gyroYrate, (double)(micros() - timer) / 1000000); // calculate the angle using a Kalman filter

    timer = micros();

    /* print data to processing */
    
    Serial.print("Data: ");
    Serial.print(gyroXangle); Serial.print(",");
    Serial.print(gyroYangle); Serial.print(",");

    Serial.print(accXangle); Serial.print(",");
    Serial.print(accYangle); Serial.print(",");

    Serial.print(compAngleX); Serial.print(",");
    Serial.print(compAngleY); Serial.print(",");
    

    Serial.print(xAngle); Serial.print(",");
    Serial.println(yAngle);

    //listen for incoming messages
    serial_loop();
    delay(10);
}

void serial_loop() {
    while(Serial.available() > 0){
        incomingChar = Serial.read();

        if(incomingChar == 10){
            handle_message(incomingStr);
            incomingStr = "";
        }else{
            incomingStr += char(incomingChar);
        }
    }
}

void handle_message(String msg){

    if(msg == "init_pwm"){
        Serial.println("Initialized PWM");
        motors.init_pwm();
    }else if(msg == "throttle_high"){
        Serial.println("High throttle");
        motors.throttle_high();
    }else if(msg == "throttle_low"){
        Serial.println("Low throttle");
        motors.throttle_low();
    }else if(msg.substring(0, 15) == "set_speed_north"){
        //set the new speed
        Serial.print("Setting speed north: ");
        Serial.println(msg.substring(16).toInt());
        motors.set_speed_north(msg.substring(16).toInt() / 100.0);
    }else if(msg.substring(0, 15) == "set_speed_south"){
        //set the new speed
        Serial.print("Setting speed south: ");
        Serial.println(msg.substring(16).toInt());
        motors.set_speed_north(msg.substring(16).toInt() / 100.0);
    }else if(msg == "stop_pwm") {
        Serial.print("Stopping PWM (may require re-arming)");
        motors.stop_pwm();
    }
}

void i2cWrite(uint8_t address, uint8_t registerAddress, uint8_t data) {
    Wire.beginTransmission(address);
    Wire.write(registerAddress);
    Wire.write(data);
    Wire.endTransmission();
}

uint8_t* i2cRead(uint8_t address, uint8_t registerAddress, uint8_t nbytes) {
    uint8_t data[nbytes];
    Wire.beginTransmission(address);
    Wire.write(registerAddress);
    Wire.endTransmission();
    Wire.beginTransmission(address);
    Wire.requestFrom(address, nbytes);
    for (uint8_t i = 0; i < nbytes; i++)
        data[i] = Wire.read();
        Wire.endTransmission();
    return data;
}

int readGyroX() { // This really measures the y-axis of the gyro
    uint8_t* data = i2cRead(gyroAddress, 0x1F, 2);
    return ((data[0] << 8) | data[1]);
}

int readGyroY() { // This really measures the x-axis of the gyro
    uint8_t* data = i2cRead(gyroAddress, 0x1D, 2);
    return ((data[0] << 8) | data[1]);
}

double getXangle() {
    double accXval = (double)readAccX() - zeroValue[0];
    double accZval = (double)readAccZ() - zeroValue[2];
    double angle = (atan2(accXval, accZval) + PI) * RAD_TO_DEG;
    return angle;
}

double getYangle() {
    double accYval = (double)readAccY() - zeroValue[1];
    double accZval = (double)readAccZ() - zeroValue[2];
    double angle = (atan2(accYval, accZval) + PI) * RAD_TO_DEG;
    return angle;
}

int readAccX() {
    uint8_t* data = i2cRead(adxlAddress, 0x32, 2);
    return (data[0] | (data[1] << 8));
}

int readAccY() {
    uint8_t* data = i2cRead(adxlAddress, 0x34, 2);
    return (data[0] | (data[1] << 8));
}

int readAccZ() {
    uint8_t* data = i2cRead(adxlAddress, 0x36, 2);
    return (data[0] | (data[1] << 8));
}
