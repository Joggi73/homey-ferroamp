// EHUB_TRADE_DECISION.js
// This script decides if the EnegryHub should charge or discharge the battery 
// considering the spot price now compared to the previous and coming hours. 
//
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
//  let bl_tibber_price_now = "bl_tibber_price_now";  // Lowest price today from Tibber
let bl_ehub_esm_soc = "bl_ehub_esm_soc";          // State Of Charge for battery [%]
let bl_ehub_esm_soh = "bl_ehub_esm_soh";          // State Of Health for battery [%]
let bl_ehub_upper_soc_limit = "bl_ehub_upper_soc_limit";          // Upper SOC Limit when charging battery - State Of Charge for battery [%]
let bl_ehub_lower_soc_limit = "bl_ehub_lower_soc_limit";          // Lower SOC Limit when discharging battery - State Of Charge for battery [%]
let bl_time = "bl_time";        
let bl_sunrise = "bl_sunrise"; 
let bl_sunset = "bl_sunset";
let bl_sensor_ehub_ppv = "bl_sensor_ehub_ppv";   // SOLAR POWER [w] as shown in Ferroamp Cloud Dashboard
let bl_sensor_ehub_pload_tot = "bl_sensor_ehub_pload_tot";   // Loads [w] as shown in Ferroamp Cloud Dashboard
let bl_dec_time_period_1_starts = "bl_dec_time_period_1_starts";    //Type: Number. Value: 0
let bl_dec_time_period_2_starts = "bl_dec_time_period_2_starts";    //Type: Number. Value: 6
let bl_dec_time_period_3_starts = "bl_dec_time_period_3_starts";    //Type: Number. Value: 18
let bl_spot = "bl_spot";            // Prices from Power by the hour
let bl_spot_1h = "bl_spot_1h";      // Prices from Power by the hour
let bl_spot_2h = "bl_spot_2h";      // Prices from Power by the hour
let bl_spot_3h = "bl_spot_3h";      // Prices from Power by the hour
let bl_spot_4h = "bl_spot_4h";      // Prices from Power by the hour
let bl_spot_5h = "bl_spot_5h";      // Prices from Power by the hour
let bl_spot_6h = "bl_spot_6h";      // Prices from Power by the hour
let bl_spot_7h = "bl_spot_7h";      // Prices from Power by the hour
let bl_last_buy_time = "bl_last_buy_time";   
let bl_last_buy_price = "bl_last_buy_price"; 
let bl_last_buy_price_adj = "bl_last_buy_price_adj";  
let bl_last_sell_time = "bl_last_sell_time";   
let bl_last_sell_price = "bl_last_sell_price";
let bl_last_sell_price_adj = "bl_last_sell_price_adj";
let bl_ehub_debug_on = "bl_ehub_debug_on";
let bl_ehub_fixed_markup_buy = "bl_ehub_fixed_markup_buy";          // From example below: 0.1
let bl_ehub_fixed_markup_sell = "bl_ehub_fixed_markup_sell";        // From example below: 0.67
let bl_ehub_variable_markup_buy = "bl_ehub_variable_markup_buy";    // From example below: 1.25
let bl_ehub_variable_markup_sell = "bl_ehub_variable_markup_sell";  // From example below: 1

// Write to variables
// let bl_ehub_trade_or_not = "bl_ehub_trade_or_not";  // Current decision if to trade today or not
let bl_ehub_charge_or_discharge = "bl_ehub_charge_or_discharge"; //Type: Number. Value: 0. Meaning: 0 = Use EHub own setting, 1 = Charge, -1 = Discharge,  
// let bl_ehub_lowerLimitToStartCharge = "bl_ehub_lowerLimitToStartCharge";
// let bl_ehub_highLimitToStartDischarge = "bl_ehub_highLimitToStartDischarge";
let bl_ehub_message_to_user = "bl_ehub_message_to_user";
let bl_ehub_debug_message = "bl_ehub_debug_message";
let bl_adj_buy_price = "bl_adj_buy_price";
let bl_adj_sell_price = "bl_adj_sell_price";

// Decide if to trade today
//let TradeOrNot = 0;
let ChargeOrDischarge = 0.0;
let messageToUser = "";
let debugMessage = "";
//let TodaysMaxMinDiff = 0;

//get Better Logic variables
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 

let temp36a = await BLApp.apiGet(bl_ehub_fixed_markup_buy);
    let fixed_markup_buy = parseFloat(temp36a.value);
let temp37a = await BLApp.apiGet(bl_ehub_fixed_markup_sell);
    let fixed_markup_sell = parseFloat(temp37a.value);
let temp38a = await BLApp.apiGet(bl_ehub_variable_markup_buy);
    let variable_markup_buy = parseFloat(temp38a.value);
let temp39a = await BLApp.apiGet(bl_ehub_variable_markup_sell);
    let variable_markup_sell = parseFloat(temp39a.value);
let temp1 = await BLApp.apiGet(bl_ehub_price_gap_to_trade);
    let gapToTrade = parseFloat(temp1.value);
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

let temp20 = await BLApp.apiGet(bl_spot_max_next_8h);
    let spot_max_next_8h = parseFloat(temp20.value);
    let adj_spot_max_next_8h = AdjustedSellPrice(spot_max_next_8h, fixed_markup_sell, variable_markup_sell)

let temp21 = await BLApp.apiGet(bl_spot_min_next_8h);
    let spot_min_next_8h = parseFloat(temp21.value);
    let adj_spot_min_next_8h = AdjustedBuyPrice(spot_min_next_8h, fixed_markup_buy, variable_markup_buy)

let temp22 = await BLApp.apiGet(bl_spot_min_time_next_8h);
    let spot_min_time_next_8h = parseFloat(temp22.value);
let temp23 = await BLApp.apiGet(bl_spot_max_time_next_8h);
    let spot_max_time_next_8h = parseFloat(temp23.value);
let temp24 = await BLApp.apiGet(bl_spot);
    let priceNow = 0;
    priceNow =parseFloat(temp24.value);
    if(priceNow < 0){ priceNow = 0; } // Do not allow negative pricing incalculations
//    priceNow = priceNow.toFixed(2);
    let adjBuyPriceNow = AdjustedBuyPrice(priceNow, fixed_markup_buy, variable_markup_buy);
    adjBuyPriceNow = parseFloat(adjBuyPriceNow);
//    adjBuyPriceNow = adjBuyPriceNow.toFixed(2);
    let adjSellPriceNow = AdjustedSellPrice(priceNow, fixed_markup_sell, variable_markup_sell);
    adjSellPriceNow = parseFloat(adjSellPriceNow);
//    adjSellPriceNow = adjSellPriceNow.toFixed(2);

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
let temp33b = await BLApp.apiGet(bl_last_buy_price_adj);
    let adjBuyPriceLast = parseFloat(temp33b.value);
let temp34 = await BLApp.apiGet(bl_last_sell_time);
    let last_sell_time = parseFloat(temp34.value);
let temp35 = await BLApp.apiGet(bl_last_sell_price);
    let last_sell_price = parseFloat(temp35.value);
let temp35b = await BLApp.apiGet(bl_last_sell_price_adj);
    let adjSellPriceLast = parseFloat(temp35b.value);   

// ALWAYS DO THIS:
//      - End active buy/charge if soc above 98%, return automation to EHUB Self Consumption 
//      - End active sell/discharge if soc below 15%, return automation to EHUB Self Consumption 
if (upper_soc_limit >= 98) { upper_soc_limit = 98; }
if (lower_soc_limit <= 15) { lower_soc_limit = 15; }

// Reset last buy and sell time if more than 10h
let hours_since_last_buy = 0;
let hours_since_last_sell = 0;
    // Hours since last buy
    if(time_float > last_buy_time){
        hours_since_last_buy = time_float - last_buy_time;
    } else if (time_float < last_buy_time){
        hours_since_last_buy = time_float + 24 - last_buy_time;
    }
    if(hours_since_last_buy > 10) {
        last_buy_time = 40;       // 40 means 'a long time' in the old scriptures
        let result321a = await BLApp.apiPut("/" + bl_last_buy_time + "/" + last_buy_time);           
    }
    // Hours since last sell
    if(time_float > last_sell_time){
        hours_since_last_sell = time_float - last_sell_time;
    } else if (time_float < last_sell_time){
        hours_since_last_sell = time_float + 24 - last_sell_time;
    }
    if(hours_since_last_sell > 10) {
        last_sell_time = 40;     // 40 means 'a long time' in the old scriptures
        let result321b = await BLApp.apiPut("/" + bl_last_sell_time + "/" + last_sell_time);
    } 

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

// Do separate depending on time per day:
let current_time_period = getTimePeriod(time_float);

if(current_time_period == 1){               // After midnight to ppv starts
 
    if(willMakeTheNight) {
        ChargeOrDischarge = 0.0;  // No trade
        messageToUser = current_hour +":"+ current_minute + "A1: Will make the night. SOC " + String(soc);         
 
        // Buy anyway to sell in the morning if revenue enough and buy is before sell
/*        if(bestBuyNow(current_hour, priceNow, last_sell_time, adjSellPriceLast, spot_max_next_8h, gapToTrade)) {  
            if(soc < upper_soc_limit){   // SOC is still lower than upper limit
                ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
                // Save our buy
                let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
                let result42 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 
                let result42b = await BLApp.apiPut("/" + bl_last_buy_price_adj + "/" + adjBuyPriceNow); 

                messageToUser = current_hour +":"+ current_minute + "A Decision: Buy electricity. Price is " + priceNow + " last_sell_price: " + last_sell_price + " spot_max_next_8h: " + spot_max_next_8h + " pload "+ pload +" Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour in 8h: "+String(spot_max_time_next_8h) ; 
            } else {
                ChargeOrDischarge = 0.0;  // No trade
                messageToUser = current_hour +":"+ current_minute + "B Decision: No trading. Low price, battery full, SOC " + String(soc)+ " Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour in 8h: "+String(spot_max_time_next_8h);         
            }     
        } else {
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "B2 Decision: Will make the night. Not best buy now. SOC " + String(soc)+ " Low price hour 8h: " +String(spot_min_time_next_8h)+" High price hour 8h: "+String(spot_max_time_next_8h);         
        }
  */
    } else {
        // Need to buy, best to buy now?
        if(bestBuyNow(current_hour, adjBuyPriceNow, last_sell_time, adjSellPriceLast, adj_spot_max_next_8h, gapToTrade)){
            if(soc < upper_soc_limit){   // SOC is still lower than upper limit
                ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
                 // Save our buy
                let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
                let result44 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 
                let result44b = await BLApp.apiPut("/" + bl_last_buy_price_adj + "/" + adjBuyPriceNow); 

                //messageToUser = current_hour +":"+ current_minute + "C Decision: Need to charge/buy. Price is " + priceNow + " pload "+ pload +" ppv "+ ppv +" Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour: "+String(spot_max_time_next_8h);
                messageToUser = current_hour +":"+ current_minute + "C Decision: Need to charge/buy. " + AddBuyMessage(priceNow, adjBuyPriceNow, adjSellPriceLast, last_sell_time, adj_spot_max_next_8h, gapToTrade); 
            } else {
                ChargeOrDischarge = 0.0;  // No trade
                messageToUser = current_hour +":"+ current_minute + "D Decision: No trading. Low price, battery full, SOC " + String(soc)+ " Low price hour in 8h: " +String(spot_min_time_next_8h)+" High price hour in 8h: "+String(spot_max_time_next_8h);         
            }
        } else {
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "D2 Decision: Will NOT make the night. Not best buy now. SOC " + String(soc)+ " Low price hour 8h: " +String(spot_min_time_next_8h)+" High price hour 8h: "+String(spot_max_time_next_8h);         
        }
    }

} else if(current_time_period == 2){    // Day time 
    // Price low enough to buy?
    if(bestBuyNow(current_hour, adjBuyPriceNow, last_sell_time, adjSellPriceLast, adj_spot_max_next_8h, gapToTrade)) {   // Price low enough to buy/charge 
        if(ppv>4){                           //If panels produce much, charge from sun even if low prices
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "F Decision: Day time,low prices, panels produce "+ ppv +" Dont buy. Price is " + priceNow +" pload "+ pload + "Adjusted buy price "+adjBuyPriceNow + "Adjusted sell price "+adjSellPriceNow +" Last buy price "+ last_buy_price + " (time "  + last_buy_time +") Last sell price "+ last_sell_price +" (time "+ last_sell_time;        
        } else if(soc < upper_soc_limit){   // SOC is still lower than upper limit
            ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
            // Save our buy
            let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
            let result46 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow);
            let result46b = await BLApp.apiPut("/" + bl_last_buy_price_adj + "/" + adjBuyPriceNow);  

            //messageToUser = current_hour +":"+ current_minute + "G Decision: Buy electricity. Price is " + priceNow + "Adjusted buy price "+adjBuyPriceNow + "Adjusted sell price "+adjSellPriceNow + " last_buy_time: "  + last_buy_time +" last_buy_price: "+ last_buy_price +" last_sell_time: "+ last_sell_time +" last_sell_price: "+ last_sell_price +" pload "+ pload +" ppv "+ ppv +" spot_max_time_next_8h"+ spot_max_time_next_8h +" spot_min_next_8h"+ spot_min_next_8h +" gapToTrade"+ gapToTrade + " time_since_last_sell"+ time_since_last_sell +" time_since_last_buy"+ time_since_last_buy; 
            //messageToUser = current_hour +":"+ current_minute + "G Decision: Buy from grid. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_spot_min_next_8h, spot_min_time_next_8h, gapToTrade);
            messageToUser = current_hour +":"+ current_minute + "G Decision: Buy from grid. " + AddBuyMessage(priceNow, adjBuyPriceNow, adjSellPriceLast, last_sell_time, adj_spot_max_next_8h, gapToTrade);
        } else {
            ChargeOrDischarge = 0.0;  // No trade
            messageToUser = current_hour +":"+ current_minute + "H Decision: Low price but battery full, SOC " + String(soc);         
        }
    } else if (bestSellNow(current_hour ,adjSellPriceNow, last_buy_time, adjBuyPriceLast, adj_spot_min_next_8h, gapToTrade)){   // Price high enough to sell
        if(soc >= lower_soc_limit){             // SOC is still higher than lower limit
            ChargeOrDischarge = -1.0;  // Discharge/Ladda ur/Sell
            // Save our sell
            let result32 = await BLApp.apiPut("/" + bl_last_sell_time + "/" + current_hour); 
            let result33 = await BLApp.apiPut("/" + bl_last_sell_price + "/" + priceNow);
            let result34 = await BLApp.apiPut("/" + bl_last_sell_price_adj + "/" + adjSellPriceNow); 
     
            //messageToUser = current_hour +":"+ current_minute + "I Decision: Sell to grid. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_spot_min_next_8h, spot_min_time_next_8h, gapToTrade);
            messageToUser = current_hour +":"+ current_minute + "I Decision: Sell to grid. " + AddSellMessage( priceNow, adjSellPriceNow, adjBuyPriceLast, last_buy_time, adj_spot_min_next_8h, gapToTrade);
        
            //messageToUser = current_hour +":"+ current_minute + " I Decision: Sell electricity. Spot: " + priceNow + "Adjusted buy price "+adjBuyPriceNow + "Adjusted sell price "+adjSellPriceNow + " last_buy_time: "  + last_buy_time +" last_buy_price: "+ last_buy_price +" last_sell_time: "+ last_sell_time +" last_sell_price: "+ last_sell_price ;        
        } else {
            ChargeOrDischarge = 0.0;  // No trade, empty battery
            messageToUser = current_hour +":"+ current_minute + "J Decision: No trading. High price, but battery empty, SOC " + String(soc) +" Price: " + priceNow + " last_buy_time: " + "Adjusted buy price "+adjBuyPriceNow + "Adjusted sell price "+adjSellPriceNow + last_buy_time + " last_buy_price: " + last_buy_price ;             
        }
    } else {
        ChargeOrDischarge = 0.0;
        //messageToUser = current_hour +":"+ current_minute + "K Decision: Trade today, but not now. Spot: " + priceNow + "Adjusted buy price "+adjBuyPriceNow + "Adjusted sell price "+adjSellPriceNow +" Last buy price "+ last_buy_price + " (time "  + last_buy_time +") Last sell price "+ last_sell_price +" (time "+ last_sell_time  + "). Next max price "+ spot_max_next_8h + " (time "+spot_max_time_next_8h +"). Next min price " + spot_min_next_8h + " (time "+spot_min_time_next_8h +") spot_min_next_8h"+ spot_min_next_8h +" gapToTrade "+ gapToTrade;   
        messageToUser = current_hour +":"+ current_minute + "K Decision: Trade today, but not now. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_spot_min_next_8h, spot_min_time_next_8h, gapToTrade);
    }

} else if(current_time_period == 3){    
// Evening time, prepare for next night trading (Winter time about 15.00-23.59)
//    only sell 
//      -   if battery SOC make it til morning without buying  (Avoid sell when no sun can help refill)
//      -   or if much lower prices after midnight
//      only buy
//      -   if cant make it to morning -> buy cheapest hour
    // Test if make it to morning
    if(willMakeTheNight) {  
        if (bestSellNow(current_hour ,adjSellPriceNow, last_buy_time, adjBuyPriceLast, adj_spot_min_next_8h, gapToTrade)){   // Price high enough to sell
            
            if(soc >= lower_soc_limit){             // SOC is still higher than lower limit
                ChargeOrDischarge = -1.0;  // Discharge/Ladda ur/Sell
                // Save our sell
                let result321 = await BLApp.apiPut("/" + bl_last_sell_time + "/" + current_hour); 
                let result331 = await BLApp.apiPut("/" + bl_last_sell_price + "/" + priceNow); 
                let result332 = await BLApp.apiPut("/" + bl_last_sell_price_adj + "/" + adjSellPriceNow); 
    
                //messageToUser = current_hour +":"+ current_minute + " I2 Decision: Sell electricity. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_spot_min_next_8h, spot_min_time_next_8h, gapToTrade);        
                messageToUser = current_hour +":"+ current_minute + " I2 Decision: Sell electricity. " + AddSellMessage( priceNow, adjSellPriceNow, adjBuyPriceLast, last_buy_time, adj_spot_min_next_8h, gapToTrade);        
            } else {
                ChargeOrDischarge = 0.0;  // No trade, empty battery
                messageToUser = current_hour +":"+ current_minute + "J2 Decision: No trading. High price, but battery empty, SOC " + String(soc) +" Spot: " + priceNow + " last_buy_time: "  + last_buy_time + " last_buy_price: " + last_buy_price ;             
            }
        } else {
            ChargeOrDischarge = 0.0;  // No trade, empty battery
            messageToUser = current_hour + "J3 Decision: Will make the night. No trading. Sunrise in "+ hours_til_next_sunrise + "h and " + hours_in_battery + "h in battery.";
        }

    } else {
        //Need to charge
        if(buyingBestNowComparedToNext8Hours(priceNow, spot_1h, spot_2h, spot_3h, spot_4h, spot_5h, spot_6h, spot_7h)){
            //TradeOrNot = 1;
            ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
            // Save our buy
            let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour);             
            let result48 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 
            let result48b = await BLApp.apiPut("/" + bl_last_buy_price_adj + "/" + adjBuyPriceNow); 

            //messageToUser = current_hour +":"+ current_minute + "M Decision: Will not make the night. Charge. SOC " + String(soc) + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_spot_min_next_8h, spot_min_time_next_8h, gapToTrade);
            messageToUser = current_hour +":"+ current_minute + "M Decision: Will not make the night. Best now compared to next 8 hours. SOC " + String(soc) + AddBuyMessage(priceNow, adjBuyPriceNow, adjSellPriceLast, last_sell_time, adj_spot_max_next_8h, gapToTrade);
        }else{
            
            ChargeOrDischarge = 0.0;
            messageToUser = current_hour +":"+ current_minute + "N Decision: Will not make the night. Waiting for better price. SOC " + String(soc) +" Hours in battery "+ hours_in_battery +" hours til next sunrise "+ String(hours_til_next_sunrise) + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_spot_min_next_8h, spot_min_time_next_8h, gapToTrade);
        }
  }
} else {
    // Dont trade
    //TradeOrNot = 0;
    ChargeOrDischarge = 0.0;
    messageToUser = current_hour +":"+ current_minute + "O Decision: Unclear period..";
}

//debugMessage = debugMessage + " fixed_markup_buy " + fixed_markup_buy + " variable_markup_buy " + variable_markup_buy;
// set Better Logic variables
//let result1 = await BLApp.apiPut("/" + bl_ehub_trade_or_not + "/" + TradeOrNot ); 
    let result2 = await BLApp.apiPut("/" + bl_ehub_charge_or_discharge + "/" + ChargeOrDischarge ); 
    let result5 = await BLApp.apiPut("/" + bl_ehub_message_to_user + "/" + messageToUser ); 
    //if(bl_ehub_debug_on == true){
    let result6 = await BLApp.apiPut("/" + bl_ehub_debug_message + "/" + debugMessage ); 
    //}
    let result7 = await BLApp.apiPut("/" + bl_adj_buy_price + "/" + adjBuyPriceNow ); 
    let result8 = await BLApp.apiPut("/" + bl_adj_sell_price + "/" + adjSellPriceNow );
    
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
        debugMessage = "DEBUG: : Day time. "+ hours_til_next_sunrise + "h to sunrise. " + loc_hours_in_battery + "h in battery";

    } else if(loc_time_float > loc_sunset_float){ //Sen kväll
        loc_hours_til_next_sunrise = 24 - loc_time_float + loc_sunrise_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        debugMessage = "DEBUG: : Evening. "+ hours_til_next_sunrise + "h to sunrise. " + loc_hours_in_battery + "h in battery" ;

    } else if(loc_time_float < loc_sunrise_float){  // Tidig morgon före gryning
        //loc_hours_til_sunset = 0; // night already
        loc_hours_til_next_sunrise = loc_sunrise_float - loc_time_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        debugMessage = "DEBUG: : Night time. "+ hours_til_next_sunrise + "h to sunrise. " + loc_hours_in_battery + "h in battery" + " . Sunrise at " + loc_sunrise_float;

    } else {
            //loc_hours_til_sunset = 0;
        debugMessage = "DEBUG: Before lunch" ;
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
        debugMessage = debugMessage + " bestBuy expensive forward forward_price_gap " + forward_price_gap;
        return true;  
    // Buy if have sold earlier to good price and now can buy back to low price
    } else if (time_since_last_sell > 0 && time_since_last_sell < 10 && backward_price_gap > 0 && backward_price_gap > gapToTrade_loc){     
        debugMessage = debugMessage + " bestBuy (have sold) backward_price_gap " + backward_price_gap;
        return true;
    } else {
        return false;
    }
}

function bestSellNow(hour_now_loc, price_now_loc, last_buy_time_loc, last_buy_price_loc, spot_min_next_8h_loc, gapToTrade_loc){
    const forward_price_gap = price_now_loc - spot_min_next_8h_loc;
    const backward_price_gap = price_now_loc - last_buy_price_loc;

    if(hour_now_loc > last_buy_time_loc){
        time_since_last_buy = hour_now_loc - last_buy_time_loc;
    } else if (hour_now_loc < last_buy_time_loc){
        time_since_last_buy = hour_now_loc + 24 - last_buy_time_loc;
    } 

    // Sell if can buy back in 8h.
    if(forward_price_gap > 0 && forward_price_gap > gapToTrade_loc){ 
        debugMessage = debugMessage + "bestSell cheap forward forward_price_gap " + forward_price_gap;
        return true;
    // Sell again if bought cheap within 10 hours before and now can sell more expensive
    } else if (time_since_last_buy > 0 && time_since_last_buy < 10 && backward_price_gap > gapToTrade_loc){     
        debugMessage = debugMessage + "bestSell (have bought) backward_price_gap " + backward_price_gap;
        return true;
    } else {
        return false;
    }
}

function AdjustedBuyPrice (price_now, fixed_markup, variable_markup){
    var adj_buy = 0;
    if (price_now > 0){
        adj_buy = (price_now * variable_markup) + fixed_markup;
        debugMessage = debugMessage + " adj_buy " + adj_buy + " fixed_markup " +fixed_markup + " variable_markup " +variable_markup;
    } else {
        adj_buy = price_now + fixed_markup;
        debugMessage = debugMessage + " adj_buy " + adj_buy + " fixed_markup " +fixed_markup;
    }
    adj_buy = adj_buy.toFixed(2);
    return adj_buy;
}

function AdjustedSellPrice (price_now, fixed_markup, variable_markup){
    var adj_sell = 0;
    if(price_now > 0){
        adj_sell = (price_now * variable_markup) + fixed_markup;
        debugMessage = debugMessage + " adj_sell " + adj_sell + " fixed_markup " +fixed_markup + " variable_markup " +variable_markup;
        
    } else {
        adj_sell = price_now + fixed_markup;
        debugMessage = debugMessage + " adj_sell " + adj_sell + " fixed_markup " +fixed_markup;
    }
    adj_sell = adj_sell.toFixed(2);
    return adj_sell;
}

function AddMessage(addSpot, addAdjBuy, addAdjSell
    , addLastBuy, addAdjLastBuy, addLastBuyTime
    , addLastSell, addAdjLastSell, addLastSellTime
    , addSpotMaxIn8h, addAdjSpotMaxIn8h, addSpotMaxTimeIn8h
    , addSpotMinIn8h, addAdjSpotMinIn8h, addSpotMinTimeIn8h
    , addGapToTrade){
    var local_string = "";
    
    local_string = 
    "Spot: " + addSpot
    + " Last buy: " + addLastBuy
    + " Last sell: " + addLastSell
    + " Adjusted buy price: " + addAdjBuy
    + " (adj last sell: " + addAdjLastSell + ","
    + " max price in 8h: " + addAdjSpotMaxIn8h + ")"
    + " Adjusted sell price: " + addAdjSell 
    + " (adj last buy: " + addAdjLastBuy + ","
    + " min price in 8h: " + addAdjSpotMinIn8h + ")"; 
    
    if(addLastBuyTime >= 40) {
        local_string = local_string + " (Last buy time is old)";
    } else {
        local_string = local_string + " (Last buy time "+ addLastBuyTime + ") ";
    }
    
    if(addLastSellTime >= 40) {
        local_string = local_string + " (Last sell time is old)";
    } else {
        local_string = local_string + " (Last sell time "+ addLastSellTime + ") ";
    }
    
    
    local_string = local_string 
    + " Next max in 8h: "+ addSpotMaxIn8h 
    + " (time " + addSpotMaxTimeIn8h 
    +"). Next min in 8h: " + addSpotMinIn8h 
    + " (time "+addSpotMinTimeIn8h 
    + " Needed price gap "+ addGapToTrade;   

    return local_string; 
}


function AddBuyMessage(addSpot, addAdjBuy
    , addAdjLastSell, addLastSellTime
    , addAdjSpotMaxIn8h
    , addGapToTrade){
    var local_string = "";
    
    local_string = 
    "Spot: " + addSpot
    + " Adjusted buy price: " + addAdjBuy
    + " (adj last sell: " + addAdjLastSell + ","
    + " max price in 8h: " + addAdjSpotMaxIn8h + ")"; 
     
    if(addLastSellTime >= 40) {
        local_string = local_string + " (Last sell time is old)";
    } else {
        local_string = local_string + " (Last sell time "+ addLastSellTime + ") ";
    }
    
    local_string = local_string 
 //   + " Next max in 8h: "+ addSpotMaxIn8h 
 //   + " (time " + addSpotMaxTimeIn8h 
 //  +"). Next min in 8h: " + addSpotMinIn8h 
 //   + " (time "+addSpotMinTimeIn8h 
    + " Needed price gap "+ addGapToTrade;   

    return local_string; 
}


function AddSellMessage(addSpot, addAdjSell
    , addAdjLastBuy, addLastBuyTime
    , addAdjSpotMinIn8h
    , addGapToTrade){
    var local_string = "";
    
    local_string = 
    "Spot: " + addSpot
    + " Adjusted sell price: " + addAdjSell 
    + " (adj last buy: " + addAdjLastBuy + ","
    + " min price in 8h: " + addAdjSpotMinIn8h + ")"; 
    
    if(addLastBuyTime >= 40) {
        local_string = local_string + " (Last buy time is old)";
    } else {
        local_string = local_string + " (Last buy time "+ addLastBuyTime + ") ";
    } 
    
    local_string = local_string 
 //   + " Next max in 8h: "+ addSpotMaxIn8h 
 //   + " (time " + addSpotMaxTimeIn8h 
 //  +"). Next min in 8h: " + addSpotMinIn8h 
 //   + " (time "+addSpotMinTimeIn8h 
    + " Needed price gap "+ addGapToTrade;   

    return local_string; 
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

// ALWAYS DO THIS:
//      - End active buy/charge if soc above 98%, return automation to EHUB Self Consumption 
//      - End active sell/discharge if soc below 15%, return automation to EHUB Self Consumption 
//      - Use the spot price, but calculate what the actual buy and sell price is to you with fixed and variable markups
// Do separate depending on time per day:
//      ->>  Calculate the night length and do decision based on ppv hours per day
//      ->>  Record when ppv hours starts and stop 
// Use decision time periods:
//  1. 00- ppv time starts 
//                      Only buy what can be sold during morning with revenue
//  2. ppv time starts - x before time ppv falls  
//                      Separate buy and sell decisions:
//                          Buy:   Only buy if have sold or able to sell in ca 8h.
//                          Sell:  Sell pricy             
//  3. x before ppv falls, 
//      -   only sell if battery SOC make it til morning without buying (Aim to overnight with Self Consumption )
//      -   only buy if cant make it to morning -> buy cheapest hour
//      -   produce from sun in the morning instead.
//  
// Set a minimum price gap for sell/buy
    // (Swedish) example how to set the fixed and variable markup values for sell and buy 
    //Revenue to sell is (adjusted sell price)
        // Spot price
        // + Grid comp (Ellevio) fixed production revenue 0.054 [SEK/kWh]
        // + Fixed tax reduction from govt = 0.60 [SEK/kWh]
        // Revenue to sell = Spot price + 0.6540 [SEK/kWh] (fixed markup)
    //Cost to buy (adjusted buy price)
        // Spot price + VAT/moms (25%), other fixed costs (ca 0.10 [SEK/kWh]) + 0.08 [SEK/kWh] (Electricity vendor like Tibber, etc..)     
        // Grid comp (Ellevio) 0.79 [kr/kWh] inc taxes
        // Cost to buy = Spot price + spot*1.25 [SEK/kWh] (variable markup) + 0.79 [SEK/kWh](fixed markup) + 0.08 [SEK/kWh] (fixed markup)
    // Ex. spot 1kr/kWh:
    // Sell: 1.00 + 0.654 = 1.654
    // Buy: 1.00 + 0.25 + 0.79 + 0.08 = 2.12
    // Diff: 0.466
    // Ex. spot 0.20kr/kWh:
    // Sell: 0.20 + 0.654 = 0.854
    // Buy: 0.20 + 0.05 + 0.79 + 0.08 = 1.12
    // Diff: 0.27
    // Consensus: Gap increases with increased spot price. Calc functions provided above.