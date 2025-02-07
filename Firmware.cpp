#include <Wire.h> // Required for I2C communication
#include <MAX30105.h> // or <MAX86150.h> if using MAX86150
#include <OneWire.h>
#include <DallasTemperature.h>

// MAX30102/MAX86150 Settings
MAX30105 particleSensor; // Use MAX86150 particleSensor for MAX86150
const byte RATE_SIZE = 4; // Amount of averaging.  4 is good.
byte rates[RATE_SIZE]; // Array of heart rates
byte rateSpot = 0;
long lastBeat = 0;
float irBuffer[500]; //infrared values
int SPO2; //SPO2 value

// DS18B20 Settings
#define ONE_WIRE_BUS 2 // Data wire is plugged into digital pin 2
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
float temperatureC = 0.0;


void setup() {
  Serial.begin(115200); // Adjust baud rate if needed

  // Initialize MAX30102/MAX86150
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) { // Use I2C_SPEED_FAST for 400kHz
    Serial.println("MAX30102/MAX86150 was not found. Please check wiring.");
    while (1);
  }

  particleSensor.setup(); // Configure sensor defaults

  // Initialize DS18B20
  sensors.begin();
}


void loop() {
  // Read MAX30102/MAX86150
    long irValue = particleSensor.getIR();  // Read IR value

    //Heart Rate Calculation
    if (checkForBeat(irValue) == true)
    {
      //We sensed a beat!
      long delta = millis() - lastBeat;
      lastBeat = millis();

      rates[rateSpot++] = (byte)60 / (delta / 1000.0);

      rateSpot %= RATE_SIZE;

      //Take average of rates
      byte rateAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++)
        rateAvg += rates[x];
      rateAvg /= RATE_SIZE;
    }


    //SPO2 calculation (simplified - more complex algorithms exist)
    SPO2 = map(irValue, 0, 2000, 70, 100); //Example Mapping. Calibrate this!
    SPO2 = constrain(SPO2, 70, 100);  //Keep in a reasonable range

  // Read DS18B20
  sensors.requestTemperatures();
  temperatureC = sensors.getTempCByIndex(0);

  // Create a JSON string for the data
  String jsonString = "{";
  jsonString += "\"heartRate\":" + String(rates[0]) + ",";
  jsonString += "\"spo2\":" + String(SPO2) + ",";
  jsonString += "\"temperature\":" + String(temperatureC);
  jsonString += "}";

  // Send the JSON string over Serial
  Serial.println(jsonString);

  delay(50); // Adjust delay as needed
}



bool checkForBeat(long sample)
{
  static long lastSampleTime = millis();
  static float rate = 0;

  //Subtract out the DC component before doing anything
  irBuffer[0] = sample;

  long delta = millis() - lastSampleTime;
  lastSampleTime = millis();
  rate = 0.99 * rate + 0.01 * delta;

  //Now do thresholding

  static long lastBeatTime = 0;  //When did the last beat occur?
  static float thresh = 5250;     //Used to find peaks in pulse wave, adjust this value
  static int beatCount = 0;

  //Look for a rising edge
  if (sample < thresh && beatCount == 0)
  {
    beatCount = 1;
  }

  //Then a falling edge
  if (sample > thresh && beatCount == 1)
  {
    beatCount = 0;
    thresh = sample + (sample - thresh) * 0.8; //Adjust thresh based on the new peak
    return true;
  }
  return false;
}