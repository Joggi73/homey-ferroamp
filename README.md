# Homey Pro for Ferroamp EnergyHub
## Target
The following flows and javascripts are tools for starting your own automation with Homey Pro and ferroamp EnergyHub integration depending on spot prices and generated solar power.
## Prerequisites
### Install the following apps to Homey Pro
-	HomeyScript
-	Power by the Hour
-	MQTT Client
-	Better Logic Library
-	CountDown
### Nice to have
-	'Fing' on your smartphone (or similar tool) to se devices and IP’s on your network
-	'MQTT Explorer' on your computer to debug if the hub sends anything on your network
### Preparations
-   Contact Ferroamp Support and ask for access and credentials to connect to the 'Ferroamp External API' on your EnergyHub. They will give you the username and password for the Energy MQTT broker running on your EnergyHub. Data and commands can then be recieved/sent using a MQTT client on Homey Pro connecting to the MQTT broker residing on your local Ferroamp EnergyHub.
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
    -   Use LWT:        No  
-   Better Logic Library (BL)
    -   On Homey Pro, goto settings, find the app 'Better Logic Library'. Select 'Configure' and add the variables specified in: 
        -   EHUB_TRADE_DECISON.js. As example add the variable "bl_ehub_price_gap_to_trade"
        -   EHUB_CTRL_REQUEST.js
        -   EHUB_CTRL_RESPONSE_MQTT.js
        -   EHUB_CTRL_RESULT_MQTT.js
        -   EHUB_GET_MQTT.js
        -   EHUB_ESM_GET_MQTT.js
-   Power by the Hour
    In Homey goto the Devices page, add power by the hour as a device. Click the device and the settings symbol. The following settingsmight change in the future, but right now I use exchange reates, bidding zones (SE3). See picture of settings in attached doc file.
-   CountDown
    On Homey Pro, goto settings, find the app 'CountDown' app. Select 'Configure' and add the timers:
        -   MqttCountDownToStart
        -   EHUB_ESM_TIMER 
-   HomeyScript
        When you installed HomeyScript you will get a script icon 
        </> in the left pane. From there; add a new HomeyScript and copy/past the java scripts code into it (EHUB_TRADE_DECISION.js and so on).
## Adding the flows
    -   For flows in picture format, download the homey-ferroamp-flows.doc file