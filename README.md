# Homey Pro for Ferroamp EnergyHub
## Prerequisites
### Install the following apps to Homey Pro
-	Power by the Hour
-	MQTT Client
-	HomeyScript
-	Better Logic Library
-	CountDown
-	(Tibber not used for prices anymore)
### Nice to have
-	Fing (or similar tool to se devices and IP’s on your network)
-	MQTT Explorer (to debug if the hub sends anything on your network)
### Preparations
-   Contact Ferroamp Support and ask for access and credentials to the Ferroamp External API on your EnergyHub. They will give you the username and password for your Energy MQTT broker. Data and commands can then be recieved/sent using a MQTT client on Homey Pro connecting to the MQTT broker residing on your local Ferroamp EnergyHub.
-	Ensure the Homey is on the same network as the EnergyHub and find out the IP’s:
    -	EnergyHub 	192.168.150.124 (if that is what you find)
    -	Homey 	192.168.150.125 (if that is what you find)
-	Install the ‘MQTT Client’ for Homey. (Make sure to use the latest version to ensure compatibility with Homey Pro 2023 etc.)
-	MQTT Client Settings
    -   IP Adress (for the EnergyHub): 		192.168.150.124 (if that is what you find)
    -	Port number: 	1883
    -   Keep alive:     60 seconds
    -	Username/password:	<From Ferroamp support> ('extapi' is common)
    -	Client ID:		<Set your own text string>
    -   Enable to provide for a custom client id..Yes
    -   Client ID:      <Set your unique Id like: Simpsons_MQTT_Client>
    -   Use LWT:    Yes  
    -   Use LWT Topic: extapi/control/request
    -   LWT message:    {"transid":"1005","cmd":{"name":"auto"}} 
-   Better Logic Library (BL)
    -   On Homey Pro, goto settings, find the app 'Better Logic Library'. Select 'Configure' and add the variables specified in: 
        -   EHUB_TRADE_DECISON.js. As example add the variable "bl_ehub_price_gap_to_trade"
        -   EHUB_CTRL_REQUEST.js
        -   EHUB_CTRL_RESPONSE_MQTT.js
        -   EHUB_CTRL_RESULT_MQTT.js
        -   EHUB_GET_MQTT.js
        -   EHUB_ESM_GET_MQTT.js
-   Power by the Hour
    -   TBD..
-   CountDown
    -   On Homey Pro, goto settings, find the app 'CountDown' app. Select 'Configure' and add the timers:
        -   MqttCountDownToStart
        -   EHUB_ESM_TIMER 
## Adding the flows
    -   TBD


