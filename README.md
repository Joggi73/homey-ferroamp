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
-	Ensure the Homey is on the same network as the EnergyHub and find out the IP’s
-	EnergyHub 	192.168.150.124 (if that is what you find)
-	Homey 	192.168.150.125 (if that is what you find)
-	Install the ‘MQTT Client’ for Homey. (Make sure to use the latest version to ensure compatibility with Homey Pro 2023 etc.)
-	MQTT Client Settings
-	IP Adress: 		192.168.150.124 (if that is what you find)
-	Port number 	1883
-	Username/password	<From Ferroamp support>
-	Client ID		<Set your own text string>