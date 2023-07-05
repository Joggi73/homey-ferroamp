// Make sure BetterLogic is installed
let bl = await Homey.apps.getApp({ id: 'net.i-dev.betterlogic' } );
if (!bl) {
console.error('Better Logic not installed!')
return false;
}
// First create the following numeric variables in BetterLogic
//Then bring them into the script 
// Read variables
let bl_ehub_price_gap_to_trade = "bl_ehub_price_gap_to_trade";  // Price gap neccessary to trade. Input to trade decision. 
let bl_spot_max_next_8h = "bl_spot_max_next_8h";  
let bl_spot_min_next_8h = "bl_spot_min_next_8h";  
let bl_spot_min_time_next_8h = "bl_spot_min_time_next_8h";
let bl_spot_max_time_next_8h = "bl_spot_max_time_next_8h";
let bl_tibber_price_now = "bl_tibber_price_now";  // Lowest price today from Tibber
let bl_ehub_esm_soc = "bl_ehub_esm_soc";          // State Of Charge for battery [%]
let bl_ehub_esm_soh = "bl_ehub_esm_soh";          // State Of Health for battery [%]
let bl_ehub_upper_soc_limit = "bl_ehub_upper_soc_limit";          // Upper SOC Limit when charging battery - State Of Charge for battery [%]
let bl_ehub_lower_soc_limit = "bl_ehub_lower_soc_limit";          // Lower SOC Limit when discharging battery - State Of Charge for battery [%]
let bl_time = "bl_time";        
let bl_sunrise = "bl_sunrise"; 
let bl_sunset = "bl_sunset";
let bl_sensor_ehub_ppv = "bl_sensor_ehub_ppv";   // SOLAR POWER [w] as shown in Ferroamp Cloud Dashboard
let bl_sensor_ehub_pload_tot = "bl_sensor_ehub_pload_tot";   // SOLAR POWER [w] as shown in Ferroamp Cloud Dashboard
let bl_dec_time_period_1_starts = "bl_dec_time_period_1_starts";
let bl_dec_time_period_2_starts = "bl_dec_time_period_2_starts";
let bl_dec_time_period_3_starts = "bl_dec_time_period_3_starts";
let bl_tesla_charge_level = "bl_tesla_charge_level";    // Tesla sharge limit from Tesla app
let bl_tesla_soc = "bl_tesla_soc";    // Tesla sharge limit from Tesla app
let bl_spot_now = "bl_spot_now";    // Prices from Power by the hour
let bl_spot_1h = "bl_spot_1h";    // Prices from Power by the hour
let bl_spot_2h = "bl_spot_2h";    // Prices from Power by the hour
let bl_spot_3h = "bl_spot_3h";    // Prices from Power by the hour
let bl_spot_4h = "bl_spot_4h";    // Prices from Power by the hour
let bl_spot_5h = "bl_spot_5h";    // Prices from Power by the hour
let bl_spot_6h = "bl_spot_6h";    // Prices from Power by the hour
let bl_spot_7h = "bl_spot_7h";    // Prices from Power by the hour
let bl_last_buy_time = "bl_last_buy_time";   
let bl_last_buy_price = "bl_last_buy_price";  
let bl_last_sell_time = "bl_last_sell_time";   
let bl_last_sell_price = "bl_last_sell_price";
let bl_ehub_debug_on = "bl_ehub_debug_on";

// Write to variables
let bl_ehub_trade_or_not = "bl_ehub_trade_or_not";  // Current decision if to trade today or not
let bl_ehub_charge_or_discharge = "bl_ehub_charge_or_discharge"; // 0 = Use EHub own setting, 1 = Charge, 2 = Discharge,  
let bl_ehub_lowerLimitToStartCharge = "bl_ehub_lowerLimitToStartCharge";
let bl_ehub_highLimitToStartDischarge = "bl_ehub_highLimitToStartDischarge";
let bl_ehub_message_to_user = "bl_ehub_message_to_user";
let bl_ehub_debug_message = "bl_ehub_debug_message";
let bl_tesla_charge_current = "bl_tesla_charge_current";
let bl_tesla_charge_on = "bl_tesla_charge_on";

// Decide if to trade today
let TradeOrNot = 0;
let ChargeOrDischarge = 0.0;
let messageToUser = "None";
let debugMessage = "..";
//let TodaysMaxMinDiff = 0;

//get Better Logic variables
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 
let temp1 = await BLApp.apiGet(bl_ehub_price_gap_to_trade);
    let gapToTrade = parseFloat(temp1.value);
let temp4 = await BLApp.apiGet(bl_tibber_price_now);
    let priceNow = parseFloat(temp4.value);
let temp5 = await BLApp.apiGet(bl_ehub_esm_soc);
    let soc = parseFloat(temp5.value);
let temp6 = await BLApp.apiGet(bl_ehub_upper_soc_limit);
    let upper_soc_limit = parseFloat(temp6.value);
let temp7 = await BLApp.apiGet(bl_ehub_lower_soc_limit);
    let lower_soc_limit = parseFloat(temp7.value);
let temp8 = await BLApp.apiGet(bl_time);
    let time = temp8.value;
    let current_hour = parseFloat(time.substr(0,2));
    let current_minute = parseFloat(time.substr(3,2));
    let time_float = current_hour + current_minute/60;
let temp9 = await BLApp.apiGet(bl_sunrise);     // Here use morning golden hour ends
    let sunrise = temp9.value;
    let sunrise_hour = parseFloat(sunrise.substr(0,2));
    let sunrise_minute = parseFloat(sunrise.substr(3,2));
    let sunrise_float = sunrise_hour + sunrise_minute/60;
let temp10 = await BLApp.apiGet(bl_sunset);     // Here use evening golden hour starts
    let sunset = temp10.value;
    let sunset_hour = parseFloat(sunset.substr(0,2));
    let sunset_minute = parseFloat(sunset.substr(3,2));
    let sunset_float = sunset_hour + sunset_minute/60;
let temp13 = await BLApp.apiGet(bl_sensor_ehub_ppv);
    let ppv = parseFloat(temp13.value)/1000;
    ppv = ppv.toPrecision(4);
let temp14 = await BLApp.apiGet(bl_sensor_ehub_pload_tot);
    let pload = parseFloat(temp14.value)/1000;
    pload = pload.toPrecision(4);
let temp15 = await BLApp.apiGet(bl_dec_time_period_1_starts);
    let period1_start = parseFloat(temp15.value);
    period1_start = period1_start.toPrecision(4);
let temp16 = await BLApp.apiGet(bl_dec_time_period_2_starts);
    let period2_start = parseFloat(temp16.value);
    period2_start = period2_start.toPrecision(4);
let temp17 = await BLApp.apiGet(bl_dec_time_period_3_starts);
    let period3_start = parseFloat(temp17.value);
    period3_start = period3_start.toPrecision(4);
let temp18 = await BLApp.apiGet(bl_tesla_charge_level);
    let tesla_charge_limit = parseFloat(temp18.value);
let temp19 = await BLApp.apiGet(bl_tesla_soc);
    let tesla_soc = parseFloat(temp19.value);
let temp20 = await BLApp.apiGet(bl_spot_max_next_8h);
    let spot_max_next_8h = parseFloat(temp20.value);
let temp21 = await BLApp.apiGet(bl_spot_min_next_8h);
    let spot_min_next_8h = parseFloat(temp21.value);
let temp22 = await BLApp.apiGet(bl_spot_min_time_next_8h);
    let spot_min_time_next_8h = parseFloat(temp22.value);
let temp23 = await BLApp.apiGet(bl_spot_max_time_next_8h);
    let spot_max_time_next_8h = parseFloat(temp23.value);
let temp24 = await BLApp.apiGet(bl_spot_now);
    let spot_now = parseFloat(temp24.value);
let temp25 = await BLApp.apiGet(bl_spot_1h);
    let spot_1h = parseFloat(temp25.value);
let temp26 = await BLApp.apiGet(bl_spot_2h);
    let spot_2h = parseFloat(temp26.value);
let temp27 = await BLApp.apiGet(bl_spot_3h);
    let spot_3h = parseFloat(temp27.value);
let temp28 = await BLApp.apiGet(bl_spot_4h);
    let spot_4h = parseFloat(temp28.value);
let temp29 = await BLApp.apiGet(bl_spot_5h);
    let spot_5h = parseFloat(temp29.value);
let temp30 = await BLApp.apiGet(bl_spot_6h);
    let spot_6h = parseFloat(temp30.value);
let temp31 = await BLApp.apiGet(bl_spot_7h);
    let spot_7h = parseFloat(temp31.value);
let temp32 = await BLApp.apiGet(bl_last_buy_time);
    let last_buy_time = parseFloat(temp32.value);
let temp33 = await BLApp.apiGet(bl_last_buy_price);
    let last_buy_price = parseFloat(temp33.value);
let temp34 = await BLApp.apiGet(bl_last_sell_time);
    let last_sell_time = parseFloat(temp34.value);
let temp35 = await BLApp.apiGet(bl_last_sell_price);
    let last_sell_price = parseFloat(temp35.value);

// ALWAYS DO THIS:
//      - End active buy/charge if soc above 98%, return automation to EHUB Self Consumption 
//      - End active sell/discharge if soc below 15%, return automation to EHUB Self Consumption 
if (upper_soc_limit >= 98) { upper_soc_limit = 98; }
if (lower_soc_limit <= 15) { lower_soc_limit = 15; }

// Reset last buy and sell time if more than 20h
let hours_since_last_buy = 0;
let hours_since_last_sell = 0;
    // Hours since last buy
    if(time_float > last_buy_time){
        hours_since_last_buy = time_float - last_buy_time;
    } else if (time_float < last_buy_time){
        hours_since_last_buy = time_float + 24 - last_buy_time;
    }
    if(hours_since_last_buy > 20) last_buy_time = 33;

    // Hours since last sell
    if(time_float > last_sell_time){
        hours_since_last_sell = time_float - last_sell_time;
    } else if (time_float < last_sell_time){
        hours_since_last_sell = time_float + 24 - last_sell_time;
    }
    if(hours_since_last_sell > 20) last_sell_time = 33;

// Max mins for coming 8h
let MaxMinDiff_8h = spot_max_next_8h - spot_min_next_8h;
let MidPrice_8h = spot_min_next_8h + (spot_max_next_8h - spot_min_next_8h)/2;
let lowerLimitToStartCharge_8h =  MidPrice_8h - gapToTrade/2;
    lowerLimitToStartCharge_8h = lowerLimitToStartCharge_8h.toPrecision(4);
let highLimitToStartDischarge_8h = MidPrice_8h + gapToTrade/2;
    highLimitToStartDischarge_8h = highLimitToStartDischarge_8h.toPrecision(4);

// Calculations, will battery SOC make it til next morning without grid?
let hours_til_next_sunrise = 0;
let average_burn_rate = 6; //[SOC%/hour]
let hours_in_battery = 0;
if(soc > lower_soc_limit){
    hours_in_battery = (soc - lower_soc_limit) / average_burn_rate;
} else {
    hours_in_battery = 0;
}
hours_in_battery = hours_in_battery.toPrecision(4);
let willMakeTheNight = false;
willMakeTheNight = makeItToMorning(time_float, hours_in_battery, sunset_float, sunrise_float);    // Test if make it to morning
//debugMessage = debugMessage + " willMakeTheNight " + String(willMakeTheNight) + " time_float " + time_float + " hours_in_battery " + hours_in_battery + " sunset_float " + sunset_float + " sunrise_float " + sunrise_float;
let time_since_last_buy = 0;
let time_since_last_sell = 0;
let tesla_needs_charging = 0;
let tesla_charge_on = 0;
let asked_load_current = 0;

if (tesla_charge_limit > tesla_soc) tesla_needs_charging = 1;

// Do separate depending on time per day:
let current_time_period = getTimePeriod(time_float);

if(current_time_period == 1){               // After midnight to ppv starts
    //Basera på priser inom tidsperioden istället för hela dygnets max och min..    
  
    if(willMakeTheNight) {
        // Buy anyway to sell in the morning if revenue enough and buy is before sell
        if(bestBuyNow(current_hour, priceNow, last_sell_time, last_sell_price, spot_max_next_8h, gapToTrade)) {  
            if(soc < upper_soc_limit){   // SOC is still lower than upper limit
                ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
                // Save our buy
                let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
                let result42 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 

                messageToUser = current_hour +":"+ current_minute + "A Decision: Buy electricity. Price is " + priceNow + " and under start limit " + lowerLimitToStartCharge_8h +" pload "+ pload +" ppv "+ ppv +" Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour in 8h: "+String(spot_max_time_next_8h) ; 
            } else {
                ChargeOrDischarge = 0.0;  // No trade
                messageToUser = current_hour +":"+ current_minute + "B Decision: No trading. Low price, battery full, SOC " + String(soc)+ " Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour in 8h: "+String(spot_max_time_next_8h);         
            }     
        } else {
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "B2 Decision: Will make the night. Not best buy now. SOC " + String(soc)+ " Low price hour 8h: " +String(spot_min_time_next_8h)+" High price hour 8h: "+String(spot_max_time_next_8h);         
        }
    } else {
        // Need to buy, when buy?
        //if(current_hour = spot_min_time_next_8h) {//Lowest not for next 8 hours -> Buy/Charge
        if(bestBuyNow(current_hour, priceNow, last_sell_time, last_sell_price, spot_max_next_8h, gapToTrade)){
            if(soc < upper_soc_limit){   // SOC is still lower than upper limit
                ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
                 // Save our buy
                let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
                let result44 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 

                messageToUser = current_hour +":"+ current_minute + "C Decision: Need to charge/buy. Price is " + priceNow + " and under start limit " + lowerLimitToStartCharge_8h +" pload "+ pload +" ppv "+ ppv +" Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour: "+String(spot_max_time_next_8h) ; 
            } else {
                ChargeOrDischarge = 0.0;  // No trade
                messageToUser = current_hour +":"+ current_minute + "D Decision: No trading. Low price, battery full, SOC " + String(soc)+ " Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour in 8h: "+String(spot_max_time_next_8h);         
            }
        } else {
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "D2 Decision: Will NOT make the night. Not best buy now. SOC " + String(soc)+ " Low price hour 8h: " +String(spot_min_time_next_8h)+" High price hour 8h: "+String(spot_max_time_next_8h);         
        }
    }

} else if(current_time_period == 2){    // Day time Panels generate
    // First, check if Tesla needs to charge, then trade..
 
    if(ppv > 4 && tesla_needs_charging == 1){    
    //    ChargeOrDischarge = 0.0;  // No trade
        // Ask loads to start loading up to max ppv level (Tesla etc.)
        // 3 x 13A = 9kW, 
        // 10A = 6.9kW
        //  8A = 5,5kW
        //  7,2A = 5kW
        
        let calculated_ask_load_current = ppv/(230*3)- 0.5 ;
        calculated_ask_load_current = calculated_ask_load_current.toPrecision(2);
        asked_load_current = Math.round(calculated_ask_load_current);
        if(asked_load_current > 13) { asked_load_current = 13; }
        if(asked_load_current < 3)  { asked_load_current =  3;  }
        messageToUser = current_hour +":"+ current_minute + "E Decision: Ask loads to charge" + String(asked_load_current) +" A. (Calc current "+ String(calculated_ask_load_current) +") Dont buy. ppv is " +ppv +" pload "+ pload ; 
        tesla_charge_on = 1;
    }
    // Price low enough to buy. Basera på priser inom tidsperioden istället för hela dygnets max och min..    
    if(bestBuyNow(current_hour, priceNow, last_sell_time, last_sell_price, spot_max_next_8h, gapToTrade)) {   // Price low enough to buy/charge 
        if(ppv>4){                           //If panels produce much, charge from sun even if low prices
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "F Decision: Day time,low prices, panels produce "+ ppv +" Dont buy. Price is " + priceNow +" pload "+ pload ;        
        } else if(soc < upper_soc_limit){   // SOC is still lower than upper limit
            ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
            // Save our buy
            let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
            let result46 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 

            messageToUser = current_hour +":"+ current_minute + "G Decision: Buy electricity. Price is " + priceNow + " last_buy_time: "  + last_buy_time +" last_buy_price: "+ last_buy_price +" last_sell_time: "+ last_sell_time +" last_sell_price: "+ last_sell_price +" pload "+ pload +" ppv "+ ppv +" spot_max_time_next_8h"+ spot_max_time_next_8h +" spot_min_next_8h"+ spot_min_next_8h +" gapToTrade"+ gapToTrade + " time_since_last_sell"+ time_since_last_sell +" time_since_last_buy"+ time_since_last_buy; 
        } else {
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "H Decision: No trading. Low price, battery full, SOC " + String(soc);         
        }
    } else if (bestSellNow(current_hour ,priceNow, last_buy_time, last_buy_price, spot_max_time_next_8h, spot_min_next_8h, gapToTrade)){   // Price high enough to sell
        if(soc >= lower_soc_limit){             // SOC is still higher than lower limit
            ChargeOrDischarge = -1.0;  // Discharge/Ladda ur/Sell
            // Save our sell
            let result32 = await BLApp.apiPut("/" + bl_last_sell_time + "/" + current_hour); 
            let result33 = await BLApp.apiPut("/" + bl_last_sell_price + "/" + priceNow); 

            messageToUser = current_hour +":"+ current_minute + " I Decision: Sell electricity. Price: " + priceNow + " last_buy_time: "  + last_buy_time +" last_buy_price: "+ last_buy_price +" last_sell_time: "+ last_sell_time +" last_sell_price: "+ last_sell_price ;        
        } else {
            ChargeOrDischarge = 0.0;  // No trade, empty battery
            messageToUser = current_hour +":"+ current_minute + "J Decision: No trading. High price, but battery empty, SOC " + String(soc) +" Price: " + priceNow + " last_buy_time: "  + last_buy_time + " last_buy_price: " + last_buy_price ;             
        }
    } else {
        ChargeOrDischarge = 0.0;
        messageToUser = current_hour +":"+ current_minute + "K Decision: Trade today, but not now. Price: " + priceNow + " last_buy_time: "  + last_buy_time +" last_buy_price: "+ last_buy_price +" last_sell_time: "+ last_sell_time +" last_sell_price: "+ last_sell_price + " spot_max_time_next_8h"+ spot_max_time_next_8h +" spot_min_next_8h"+ spot_min_next_8h +" gapToTrade"+ gapToTrade + " time_since_last_sell"+ time_since_last_sell +" time_since_last_buy"+ time_since_last_buy;        
    }

} else if(current_time_period == 3){    
// Evening time, prepare next night trading (Winter time about 15.00-23.59)
//    only sell 
//      -   if battery SOC make it til morning without buying  (Avoid sell when no sun can help refill)
//      -   or if much lower prices after midnight
//      only buy
//      -   if cant make it to morning -> buy cheapest hour
    // Test if make it to morning
    if(willMakeTheNight) {  
        if (bestSellNow(current_hour ,priceNow, last_buy_time, last_buy_price, spot_max_time_next_8h, spot_min_next_8h, gapToTrade)){   // Price high enough to sell
            if(soc >= lower_soc_limit){             // SOC is still higher than lower limit
                ChargeOrDischarge = -1.0;  // Discharge/Ladda ur/Sell
                // Save our sell
                let result321 = await BLApp.apiPut("/" + bl_last_sell_time + "/" + current_hour); 
                let result331 = await BLApp.apiPut("/" + bl_last_sell_price + "/" + priceNow); 
    
                messageToUser = current_hour +":"+ current_minute + " I2 Decision: Sell electricity. Price: " + priceNow + " last_buy_time: "  + last_buy_time +" last_buy_price: "+ last_buy_price +" last_sell_time: "+ last_sell_time +" last_sell_price: "+ last_sell_price ;        
            } else {
                ChargeOrDischarge = 0.0;  // No trade, empty battery
                messageToUser = current_hour +":"+ current_minute + "J2 Decision: No trading. High price, but battery empty, SOC " + String(soc) +" Price: " + priceNow + " last_buy_time: "  + last_buy_time + " last_buy_price: " + last_buy_price ;             
            }
        } else {
            ChargeOrDischarge = 0.0;  // No trade, empty battery
            messageToUser = current_hour +":"+ current_minute + "J3 Decision: Will make the night and not time to sell. SOC " + String(soc) + " hours_til_next_sunrise "+ hours_til_next_sunrise;             
        
        }
        // if (pricesComingNightMuchLowerThanNow()){   // Price high enough to sell
         //   if(soc >= lower_soc_limit){             // SOC is still higher than lower limit
        //        ChargeOrDischarge = -1.0;  // Discharge/Ladda ur/Sell
         //       messageToUser = current_hour +":"+ current_minute + " Decision: Sell electricity. Price: " + priceNow + " Above start limit: " + highLimitToStartDischarge_8h +" Hours in battery " +String(hours_in_battery) +" hours til next sunrise "+ String(hours_til_next_sunrise);        
        //    } else {
//                ChargeOrDischarge = 0.0;  // No trade, empty battery
//                messageToUser = current_hour +":"+ current_minute + "L Decision: Will make the night. No trading. SOC " + String(soc)+ " Low price hour next 8h: " +String(spot_min_time_next_8h)+" High price hour next 8h: "+String(spot_max_time_next_8h);
        //    }
        //}
    } else {
        //Need to charge
        if(buyingBestNowComparedToNext8Hours(spot_now, spot_1h, spot_2h, spot_3h, spot_4h, spot_5h, spot_6h, spot_7h)){
            TradeOrNot = 1;
            ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
            // Save our buy
            let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour);             
            let result48 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 

            messageToUser = current_hour +":"+ current_minute + "M Decision: Will not make the night. Charge. SOC " + String(soc)+ " Low price hour next 8h: " +String(spot_min_time_next_8h)+" High price hour next 8h: "+String(spot_max_time_next_8h);
        }else{
            
            ChargeOrDischarge = 0.0;
            messageToUser = current_hour +":"+ current_minute + "N Decision: Will not make the night. Waiting for better price. SOC " + String(soc) +" Hours in battery "+ hours_in_battery +" hours til next sunrise "+ String(hours_til_next_sunrise) +" Low price hour in 8h: " + String(spot_min_time_next_8h) + " High price hour in 8h: " + String(spot_max_time_next_8h);
        }
  }
} else {
    // Dont trade
    TradeOrNot = 0;
    ChargeOrDischarge = 0.0;
    messageToUser = current_hour +":"+ current_minute + "O Decision: Unclear period..";
}

// set Better Logic variables

let result1 = await BLApp.apiPut("/" + bl_ehub_trade_or_not + "/" + TradeOrNot ); 
let result2 = await BLApp.apiPut("/" + bl_ehub_charge_or_discharge + "/" + ChargeOrDischarge ); 
let result3 = await BLApp.apiPut("/" + bl_ehub_lowerLimitToStartCharge + "/" + lowerLimitToStartCharge_8h ); 
let result4 = await BLApp.apiPut("/" + bl_ehub_highLimitToStartDischarge + "/" + highLimitToStartDischarge_8h ); 
let result5 = await BLApp.apiPut("/" + bl_ehub_message_to_user + "/" + messageToUser ); 
let result7 = await BLApp.apiPut("/" + bl_tesla_charge_current + "/" + asked_load_current ); 
let result8 = await BLApp.apiPut("/" + bl_tesla_charge_on + "/" + tesla_charge_on ); 
if(bl_ehub_debug_on == true){
    let result6 = await BLApp.apiPut("/" + bl_ehub_debug_message + "/" + debugMessage ); 
}
return true;

// Functions
function makeItToMorning(in_loc_time_float, in_hours_in_battery, loc_sunset_float, loc_sunrise_float) {
    let loc_hours_til_next_sunrise = 0;
    let loc_hours_til_sunset = 0;
    let loc_hours_in_battery = parseFloat(in_hours_in_battery);
    //let loc_time_float = in_loc_time_float;
    let loc_time_float = in_loc_time_float.toPrecision(4);
    //Hours til sunset
 //   if ((loc_time_float < loc_sunset_float) && (loc_time_float > loc_sunrise_float)){ // is day time after mid day
    if ((loc_time_float < loc_sunset_float) && (loc_time_float > 12)){ // is day time after mid day
        loc_hours_til_sunset = loc_sunset_float - loc_time_float;
        loc_hours_til_next_sunrise = loc_hours_til_sunset + (24 - loc_sunset_float) + loc_sunrise_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        loc_hours_til_sunset = loc_hours_til_sunset.toPrecision(2);
        debugMessage = "DEBUG: : Day time and hours_til_next_sunrise "+ hours_til_next_sunrise + " loc_hours_in_battery " + loc_hours_in_battery + " loc_hours_til_sunset " + loc_hours_til_sunset ;

    } else if(loc_time_float > loc_sunset_float){ //Sen kväll
        loc_hours_til_next_sunrise = 24 - loc_time_float + loc_sunrise_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        debugMessage = "DEBUG: : Evening and hours_til_next_sunrise "+ hours_til_next_sunrise + " loc_hours_in_battery " + loc_hours_in_battery ;

    } else if(loc_time_float < loc_sunrise_float){  // Tidig morgon före gryning
        //loc_hours_til_sunset = 0; // night already
        loc_hours_til_next_sunrise = loc_sunrise_float - loc_time_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        debugMessage = "DEBUG: : Night time and hours_til_next_sunrise "+ hours_til_next_sunrise + " loc_hours_in_battery " + loc_hours_in_battery + " loc_sunrise_float " + loc_sunrise_float + " loc_time_float " + loc_time_float;

    } else {
            //loc_hours_til_sunset = 0;
        debugMessage = "DEBUG: Before lunch !!!! Not night time yet. loc_hours_in_battery " + loc_hours_in_battery ;
        return true;
    }
 
    if(loc_hours_in_battery > loc_hours_til_next_sunrise) { 
        return true; 
    } else { 
        return false;
    }
}

function getTimePeriod(hour){
    // return the time period from current time
    if (hour >= period1_start && hour < period2_start){ 
        return 1;
    } else if (hour >= period2_start && hour < period3_start){
        return 2;
    } else if (hour >= period3_start && hour < 24){
        return 3;
    } else {
        return 0;
    }
}

function buyingBestNowComparedToNext8Hours(now,hour1,hour2,hour3,hour4,hour5,hour6,hour7){
    if(now = Math.min(now,hour1,hour2,hour3,hour4,hour5,hour6,hour7)){
        return true;
    } else return false;
}

function bestBuyNow(hour_now_loc, price_now_loc, last_sell_time_loc, last_sell_price_loc, spot_max_next_8h_loc, gapToTrade_loc){
    const forward_price_gap = spot_max_next_8h_loc - price_now_loc;
    const backward_price_gap = last_sell_price_loc - price_now_loc;
    if(hour_now_loc > last_sell_time_loc){
        time_since_last_sell = hour_now_loc - last_sell_time_loc;
    } else if (hour_now_loc < last_sell_time_loc){
        time_since_last_sell = hour_now_loc + 24 - last_sell_time_loc;
    } 

    // Buy if can sell within 8h forward with enough price gap
    if(forward_price_gap > 0 && forward_price_gap > gapToTrade_loc){      
        return true;  
    // Buy if have sold earlier to good price and now can buy back to low price
    } else if (time_since_last_sell > 0 && time_since_last_sell < 10 && backward_price_gap > gapToTrade_loc){     
        return true;
    } else {
        return false;
    }
}

function bestSellNow(hour_now_loc, price_now_loc, last_buy_time_loc, last_buy_price_loc, spot_max_next_8h_loc, spot_min_next_8h_loc, gapToTrade_loc){
    const forward_price_gap = price_now_loc - spot_min_next_8h_loc;
    const backward_price_gap = price_now_loc - last_buy_price_loc;

    if(hour_now_loc > last_buy_time_loc){
        time_since_last_buy = hour_now_loc - last_buy_time_loc;
    } else if (hour_now_loc < last_buy_time_loc){
        time_since_last_buy = hour_now_loc + 24 - last_buy_time_loc;
    } 

    // Sell if can buy back in 8h.
    if(forward_price_gap > 0 && forward_price_gap > gapToTrade_loc){ 
        return true;
    // Sell again if bought cheap within 10 hours before and now can sell more expensive
    } else if (time_since_last_buy > 0 && time_since_last_buy < 10 && backward_price_gap > gapToTrade_loc){     
        return true;
    } else {
        return false;
    }
}


/*
function adjustDecisionTimePeriod(period, start_hour){
    // Set the time period to value
    if (period == 1){
        let result = await BLApp.apiPut("/" + bl_dec_time_period_1_starts + "/" + String(start_hour)); 
    } else if (period == 2){
        let result = await BLApp.apiPut("/" + bl_dec_time_period_2_starts + "/" + String(start_hour)); 
    } else if (period == 3){
        let result = await BLApp.apiPut("/" + bl_dec_time_period_3_starts + "/" + String(start_hour)); 
    }     
}
*/
/*
function pricesComingNightMuchLowerThanNow(){
    //Om morgondagens lägsta pris mycket lägre än nu
    //Om morgondagens lägsta pris sker under morgonen kl. 00-06
    return false;
}

function priceComingNightMuchHigherThanNow(){
    //Om morgondagens högsta pris mycket lägre än nu
    //Om morgondagens lägsta pris sker under morgonen kl. 00-06
    return false;
}
*/

// ALWAYS DO THIS:
//      - End active buy/charge if soc above 98%, return automation to EHUB Self Consumption 
//      - End active sell/discharge if soc below 15%, return automation to EHUB Self Consumption 
// Do separate depending on time per day:
//      ->>  Calculate the night length and do decision based on ppv hours per day
//      ->>  Record when ppv hours starts and stop 
// Use decision time periods:
//  1. 00- ppv time starts 
//                      Only buy what can be sold during morning with revenue
//  2. ppv time starts - x before time ppv falls  
//                      Normal buy sell period:
//                      First ask loads to start loading up to max ppv level (Tesla etc.)
//                      Separate buy and sell decisions:
//                          Buy:   Only buy if able to sell during rest of day or night
//                          Sell:  Sell pricy, but never if Tesla (or loads) need charging             
//  3. x before ppv falls (summer around 18.00?), 
//      only sell 
//      -   if battery SOC make it til morning without buying (Aim to overnight with Self Consumption )
//      -   or if buy next morning much less expensive (Avoid buy sell when no sun can help refill)
//      only buy
//      -   if cant make it to morning -> buy cheapest hour
// General Buy/Charging decision:
//      - That is, do not force buy electricity if SOC higher than able to make it to morning. 
//      - Produce from sun in the morning instead.
//  
// Later: 
//      Use current load and estimate recharge time from that
//      How much does the car need each night?
//      Discharge 4500kW ger -19% SOC per timma
//      Night consumption 1.2KW a 12h per dygn = ca 14kWh = Min batteristorlek
//          ->>> Om handla el med batteriet Ladda upp 3h för att kunna ladda ur 3h
//          ->>> Need current load/burn rate, soc, time now [HH], time sunrise [HH]
// Set a minimum price gap for sell/buy
    //Revenue to sell is
        // Tibber spot (utan skatter och avgifter)
        // Nätbolag (Elevio) produktionsersättning 0,0540 [kr/kWh]
        // Skattereduktion = 0,60kr/kWh
        // Revenue to sell = Tibber spot (utan moms skatter och avgifter) + 0,6540
    //Cost to buy
        // Tibber spot + moms (25%), skatter och avgifter (ca 10öre) + 0,08 kr/kWh (Tibber-påslag)     
        // Nätbolag (Elevio) 0,79 [kr/kWh] inc taxes
        // Cost to buy = Tibber spot + moms, skatter och avgifter + 0,79 [kr/kWh] + 0,08 [kr/kWh] 
    // Ex. spot 1kr/kWh:
    // Sell: 1,00 + 0,0540 + 0,60 = 1,654
    // Buy: 1,00 + 0,08 + 0,25 + 0,10  + 0,79 = 2,22
    // Diff: 0,566
    // Ex. spot 0,20kr/kWh:
    // Sell: 0,20 + 0,0540 + 0,60 = 0,854
    // Buy: 0,20 + 0,08 + 0,05 + 0,10  + 0,79 = 1,22
    // Diff: 0,366
    // Consensus: Gap ökar med ökat spotpris
    // Also: Tibber is not used anymore. Now, Power by the Hour is used as it has more price values to use.