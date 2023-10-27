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
const bl_ehub_price_gap_to_trade = "bl_ehub_price_gap_to_trade";  // Price gap neccessary to trade. Input to trade decision. 
const bl_spot_max_next_8h = "bl_spot_max_next_8h";  
const bl_spot_min_next_8h = "bl_spot_min_next_8h";  
const bl_spot_min_time_next_8h = "bl_spot_min_time_next_8h";
const bl_spot_max_time_next_8h = "bl_spot_max_time_next_8h";
//  const bl_tibber_price_now = "bl_tibber_price_now";  // Lowest price today from Tibber
const bl_ehub_esm_soc = "bl_ehub_esm_soc";          // State Of Charge for battery [%]
const bl_ehub_esm_soh = "bl_ehub_esm_soh";          // State Of Health for battery [%]
const bl_ehub_upper_soc_limit = "bl_ehub_upper_soc_limit";          // Upper SOC Limit when charging battery - State Of Charge for battery [%]
const bl_ehub_lower_soc_limit = "bl_ehub_lower_soc_limit";          // Lower SOC Limit when discharging battery - State Of Charge for battery [%]
const bl_time = "bl_time";        
const bl_sunrise = "bl_sunrise"; 
const bl_sunset = "bl_sunset";
const bl_sensor_ehub_ppv = "bl_sensor_ehub_ppv";   // SOLAR POWER [w] as shown in Ferroamp Cloud Dashboard
const bl_sensor_ehub_pload_tot = "bl_sensor_ehub_pload_tot";   // Loads [w] as shown in Ferroamp Cloud Dashboard
// let bl_dec_time_period_1_starts = "bl_dec_time_period_1_starts";    //Type: Number. Value: 0
// let bl_dec_time_period_2_starts = "bl_dec_time_period_2_starts";    //Type: Number. Value: 6
// let bl_dec_time_period_3_starts = "bl_dec_time_period_3_starts";    //Type: Number. Value: 18
const bl_spot = "bl_spot";            // Prices from Power by the hour
const bl_spot_1h = "bl_spot_1h";      // Prices from Power by the hour
const bl_spot_2h = "bl_spot_2h";      // Prices from Power by the hour
const bl_spot_3h = "bl_spot_3h";      // Prices from Power by the hour
const bl_spot_4h = "bl_spot_4h";      // Prices from Power by the hour
const bl_spot_5h = "bl_spot_5h";      // Prices from Power by the hour
const bl_spot_6h = "bl_spot_6h";      // Prices from Power by the hour
const bl_spot_7h = "bl_spot_7h";      // Prices from Power by the hour
const bl_last_buy_time = "bl_last_buy_time";   
const bl_last_buy_price = "bl_last_buy_price"; 
const bl_last_buy_price_adj = "bl_last_buy_price_adj";  
const bl_last_sell_time = "bl_last_sell_time";   
const bl_last_sell_price = "bl_last_sell_price";
const bl_last_sell_price_adj = "bl_last_sell_price_adj";
const bl_ehub_fixed_markup_buy = "bl_ehub_fixed_markup_buy";          // From example below: 0.1
const bl_ehub_fixed_markup_sell = "bl_ehub_fixed_markup_sell";        // From example below: 0.67
const bl_ehub_variable_markup_buy = "bl_ehub_variable_markup_buy";    // From example below: 1.25
const bl_ehub_variable_markup_sell = "bl_ehub_variable_markup_sell";  // From example below: 1
const bl_ehub_best_charge_hour_now = "bl_ehub_best_charge_hour_now";    // 1 means this hour is one of the best charging hours
const bl_ehub_off_season = "bl_ehub_off_season";    // 1 = WINTER TIME
// Write to variables
// let bl_ehub_trade_or_not = "bl_ehub_trade_or_not";  // Current decision if to trade today or not
const bl_ehub_charge_or_discharge = "bl_ehub_charge_or_discharge"; //Type: Number. Value: 0. Meaning: 0 = Use EHub own setting, 1 = Charge, -1 = Discharge,  
// let bl_ehub_lowerLimitToStartCharge = "bl_ehub_lowerLimitToStartCharge";
// let bl_ehub_highLimitToStartDischarge = "bl_ehub_highLimitToStartDischarge";
const bl_ehub_message_to_user = "bl_ehub_message_to_user";
const bl_ehub_debug_message = "bl_ehub_debug_message";
const bl_adj_buy_price = "bl_adj_buy_price";
const bl_adj_sell_price = "bl_adj_sell_price";

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
let temp6 = await BLApp.apiGet(bl_ehub_upper_soc_limit);    // Commonly set to 100
    let upper_soc_limit = parseFloat(temp6.value);
let temp7 = await BLApp.apiGet(bl_ehub_lower_soc_limit);    // Commonly set to 20
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
/*let temp15 = await BLApp.apiGet(bl_dec_time_period_1_starts);
    let period1_start = parseFloat(temp15.value);
    period1_start = period1_start.toPrecision(4);
let temp16 = await BLApp.apiGet(bl_dec_time_period_2_starts);
    let period2_start = parseFloat(temp16.value);
    period2_start = period2_start.toPrecision(4);
let temp17 = await BLApp.apiGet(bl_dec_time_period_3_starts);
    let period3_start = parseFloat(temp17.value);
    period3_start = period3_start.toPrecision(4);
*/
let temp20 = await BLApp.apiGet(bl_spot_max_next_8h);
    let spot_max_next_8h = parseFloat(temp20.value);
    if(spot_max_next_8h < 0){ spot_max_next_8h = 0; }
    let adj_sell_spot_max_next_8h = AdjustedSellPrice(spot_max_next_8h, fixed_markup_sell, variable_markup_sell);

let temp21 = await BLApp.apiGet(bl_spot_min_next_8h);
    let spot_min_next_8h = parseFloat(temp21.value);
    if(spot_min_next_8h < 0){ spot_min_next_8h = 0; }
    let adj_buy_spot_min_next_8h = AdjustedBuyPrice(spot_min_next_8h, fixed_markup_buy, variable_markup_buy);

let temp22 = await BLApp.apiGet(bl_spot_min_time_next_8h);
    let spot_min_time_next_8h = parseFloat(temp22.value);
let temp23 = await BLApp.apiGet(bl_spot_max_time_next_8h);
    let spot_max_time_next_8h = parseFloat(temp23.value);
let temp24 = await BLApp.apiGet(bl_spot);
    let priceNow = 0;
    priceNow =parseFloat(temp24.value);
    if(priceNow < 0){ priceNow = 0; } // Do not allow negative pricing incalculations

    let adjBuyPriceNow = AdjustedBuyPrice(priceNow, fixed_markup_buy, variable_markup_buy);
    adjBuyPriceNow = parseFloat(adjBuyPriceNow);

    let adjSellPriceNow = AdjustedSellPrice(priceNow, fixed_markup_sell, variable_markup_sell);
    adjSellPriceNow = parseFloat(adjSellPriceNow);

let temp25 = await BLApp.apiGet(bl_spot_1h);
    let spot_1h = parseFloat(temp25.value);
    if(spot_1h < 0){ spot_1h = 0; }
    let adj_sell_spot_1h = AdjustedSellPrice(spot_1h, fixed_markup_sell, variable_markup_sell);
    let adj_buy_spot_1h = AdjustedBuyPrice(spot_1h, fixed_markup_sell, variable_markup_sell);

let temp26 = await BLApp.apiGet(bl_spot_2h);
    let spot_2h = parseFloat(temp26.value);
    if(spot_2h < 0){ spot_2h = 0; }
    let adj_sell_spot_2h = AdjustedSellPrice(spot_2h, fixed_markup_sell, variable_markup_sell);
    let adj_buy_spot_2h = AdjustedBuyPrice(spot_2h, fixed_markup_sell, variable_markup_sell);
let temp27 = await BLApp.apiGet(bl_spot_3h);
    let spot_3h = parseFloat(temp27.value);
    if(spot_3h < 0){ spot_3h = 0; }
    let adj_sell_spot_3h = AdjustedSellPrice(spot_3h, fixed_markup_sell, variable_markup_sell);
    let adj_buy_spot_3h = AdjustedBuyPrice(spot_3h, fixed_markup_sell, variable_markup_sell);

    debugMessage = debugMessage + "spot_1h: " + spot_1h 
                                    + "\nspot_2h: " + spot_2h
                                    "\nspot_3h: " + spot_3h;

let temp28 = await BLApp.apiGet(bl_spot_4h);
    let spot_4h = parseFloat(temp28.value);
    if(spot_4h < 0){ spot_4h = 0; }
    let adj_buy_spot_4h = AdjustedBuyPrice(spot_4h, fixed_markup_sell, variable_markup_sell);
let temp29 = await BLApp.apiGet(bl_spot_5h);
    let spot_5h = parseFloat(temp29.value);
    if(spot_5h < 0){ spot_5h = 0; }
    let adj_buy_spot_5h = AdjustedBuyPrice(spot_5h, fixed_markup_sell, variable_markup_sell);
let temp30 = await BLApp.apiGet(bl_spot_6h);
    let spot_6h = parseFloat(temp30.value);
    if(spot_6h < 0){ spot_6h = 0; }
    let adj_buy_spot_6h = AdjustedBuyPrice(spot_6h, fixed_markup_sell, variable_markup_sell);
let temp31 = await BLApp.apiGet(bl_spot_7h);
    let spot_7h = parseFloat(temp31.value);
    if(spot_7h < 0){ spot_7h = 0; }
    let adj_buy_spot_7h = AdjustedBuyPrice(spot_7h, fixed_markup_sell, variable_markup_sell);
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
let bestChargetimeNow = 0;
    let temp40 = await BLApp.apiGet(bl_ehub_best_charge_hour_now);
    bestChargetimeNow = parseFloat(temp40.value);  
let ehub_off_season = 0;
    let temp41 = await BLApp.apiGet(bl_ehub_off_season);
    ehub_off_season = parseFloat(temp41.value);  
    

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
    } else if (time_float <= last_buy_time){
        hours_since_last_buy = time_float + 24 - last_buy_time;
    }
    if(hours_since_last_buy > 10) {
        last_buy_time = 40;       // 40 means 'a long time' in the old scriptures
        let result321a = await BLApp.apiPut("/" + bl_last_buy_time + "/" + last_buy_time);           
    }
    // Hours since last sell
    if(time_float > last_sell_time){
        hours_since_last_sell = time_float - last_sell_time;
    } else if (time_float <= last_sell_time){
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

// let willMakeTheNight = false;
let willMakeTheNight = makeItToMorning(time_float, hours_in_battery, sunset_float, sunrise_float);    // Test if make it to morning
let willMakeItToNextBuy = makeItToNextBuyTime2(hours_in_battery, gapToTrade, adjSellPriceNow, adj_buy_spot_1h, adj_buy_spot_2h, adj_buy_spot_3h, adj_buy_spot_4h, adj_buy_spot_5h, adj_buy_spot_6h, adj_buy_spot_7h);
let itIsBestSellTimeNow = bestSellNow(current_hour ,adjSellPriceNow, last_buy_time, adjBuyPriceLast, adj_buy_spot_min_next_8h, gapToTrade, adj_sell_spot_1h, adj_sell_spot_2h, adj_sell_spot_3h, ehub_off_season);
let itIsBestBuyTimeNow = bestBuyNow(current_hour, adjBuyPriceNow, last_sell_time, adjSellPriceLast, adj_sell_spot_max_next_8h, gapToTrade, adj_buy_spot_1h, adj_buy_spot_2h, adj_buy_spot_3h, adj_buy_spot_4h, adj_buy_spot_5h, adj_buy_spot_6h);
//debugMessage = debugMessage + " willMakeTheNight " + String(willMakeTheNight) + " time_float " + time_float + " hours_in_battery " + hours_in_battery + " sunset_float " + sunset_float + " sunrise_float " + sunrise_float;

// If ridiculously low spot, always charge   
if(adjBuyPriceNow <= fixed_markup_buy + 0.05){

    if(soc < upper_soc_limit - 20){   // SOC is still lower than upper limit
        ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
        // Buy
        let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
        let result44 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow); 
        let result44b = await BLApp.apiPut("/" + bl_last_buy_price_adj + "/" + adjBuyPriceNow); 

        messageToUser = current_hour +":"+ current_minute + "\nM1 Decision: Super low spot and need to charge/buy. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv); 
    } else {
        ChargeOrDischarge = 0.0;  // No trade
        messageToUser = current_hour +":"+ current_minute + "\nM2 Decision: Super low spot, but high SOC " + String(soc) + ". Adjusted buy: " + adjBuyPriceNow;         
    }    
  
    //Sell:    Sell pricy (but not more than make it to morning or next buy time or daytime)
    //    only sell 
    //      -   if battery SOC make it til morning without buying  (Avoid sell when no sun can help refill)
    //      -   or if making it to the next buy
    //      -   or panels produce
    //      AND it is a good selling price
} else if((willMakeTheNight || willMakeItToNextBuy || (ppv > 2))
        && itIsBestSellTimeNow){

    if(soc > lower_soc_limit){             // SOC is still higher than lower limit
            ChargeOrDischarge = -1.0;  // Discharge/Ladda ur/Sell
            // Save our sell
        let result321 = await BLApp.apiPut("/" + bl_last_sell_time + "/" + current_hour); 
        let result331 = await BLApp.apiPut("/" + bl_last_sell_price + "/" + priceNow); 
        let result332 = await BLApp.apiPut("/" + bl_last_sell_price_adj + "/" + adjSellPriceNow); 

        messageToUser = current_hour +":"+ current_minute + "\nM3 Decision: Sell electricity. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv);        
    } else {
        ChargeOrDischarge = 0.0;  // No trade, empty battery
        messageToUser = current_hour +":"+ current_minute + "\nM4 Decision: Good sell, but battery empty, SOC " + String(soc) +" Spot: " + priceNow + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv);
    }

    // Price low enough to buy?
    //      if cheapest hour and SOC to low
    //      only buy cheapest hour
} else if (((bestChargetimeNow == 1) && (soc < 40 || ehub_off_season == 1)) || itIsBestBuyTimeNow) {   // Price low enough to buy/charge 
    if(ppv > 2.5){                           //If panels produce much, charge from sun even if low prices
        ChargeOrDischarge = 0.0;  // No trade
        messageToUser = current_hour +":"+ current_minute + "\nM5 Decision: Day time,low prices, panels produce "+ ppv +" Dont buy. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv);
    } else if(soc < upper_soc_limit){   // SOC is still lower than upper limit
        ChargeOrDischarge = 1.0;  // Charge/Ladda/Buy
        // Save our buy
        let result45 = await BLApp.apiPut("/" + bl_last_buy_time + "/" + current_hour); 
        let result46 = await BLApp.apiPut("/" + bl_last_buy_price + "/" + priceNow);
        let result46b = await BLApp.apiPut("/" + bl_last_buy_price_adj + "/" + adjBuyPriceNow);  

        messageToUser = current_hour +":"+ current_minute + "\nM6 Decision: Buy from grid. " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv);
    } else {
        ChargeOrDischarge = 0.0;  // No trade
        messageToUser = current_hour +":"+ current_minute + "\nM7 Decision: Good buy time, but battery full or still much sun, SOC " + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv);
    }

} else {
        
    ChargeOrDischarge = 0.0;
    messageToUser = current_hour +":"+ current_minute + "\nM8 Decision: No buy, no sell.. \n SOC " + String(soc) +"\n Hours in battery "+ hours_in_battery +"\n hours til next sunrise "+ String(hours_til_next_sunrise) + AddMessage( priceNow, adjBuyPriceNow, adjSellPriceNow, last_buy_price, adjBuyPriceLast, last_buy_time, last_sell_price, adjSellPriceLast,last_sell_time, spot_max_next_8h, adj_sell_spot_max_next_8h, spot_max_time_next_8h, spot_min_next_8h, adj_buy_spot_min_next_8h, spot_min_time_next_8h, gapToTrade, willMakeItToNextBuy, willMakeTheNight, itIsBestSellTimeNow, itIsBestBuyTimeNow, soc, ppv);
}

//debugMessage = debugMessage + " fixed_markup_buy " + fixed_markup_buy + " variable_markup_buy " + variable_markup_buy;
// set Better Logic variables
//let result1 = await BLApp.apiPut("/" + bl_ehub_trade_or_not + "/" + TradeOrNot ); 
    let result2 = await BLApp.apiPut("/" + bl_ehub_charge_or_discharge + "/" + ChargeOrDischarge ); 
    let result5 = await BLApp.apiPut("/" + bl_ehub_message_to_user + "/" + messageToUser ); 
    let result6 = await BLApp.apiPut("/" + bl_ehub_debug_message + "/" + debugMessage ); 
    let result7 = await BLApp.apiPut("/" + bl_adj_buy_price + "/" + adjBuyPriceNow ); 
    let result8 = await BLApp.apiPut("/" + bl_adj_sell_price + "/" + adjSellPriceNow );
    
    return true;

    
//  Functions
function makeItToMorning(in_loc_time_float, in_hours_in_battery, loc_sunset_float, loc_sunrise_float) {
    let loc_hours_til_next_sunrise = 24;
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
        debugMessage = debugMessage + "\nDEBUG: : Day time. "+ hours_til_next_sunrise + "h to sunrise. " + loc_hours_in_battery + "h in battery";

    } else if(loc_time_float > loc_sunset_float){ //Sen kväll
        loc_hours_til_next_sunrise = 24 - loc_time_float + loc_sunrise_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        debugMessage = debugMessage + "\nDEBUG: : Evening. "+ hours_til_next_sunrise + "h to sunrise. " + loc_hours_in_battery + "h in battery" ;

    } else if(loc_time_float < loc_sunrise_float){  // Tidig morgon före gryning
        //loc_hours_til_sunset = 0; // night already
        loc_hours_til_next_sunrise = loc_sunrise_float - loc_time_float;
        loc_hours_til_next_sunrise = loc_hours_til_next_sunrise.toPrecision(2);
        hours_til_next_sunrise = loc_hours_til_next_sunrise;
        debugMessage = debugMessage + "\nDEBUG: : Night time. "+ hours_til_next_sunrise + "h to sunrise. " + loc_hours_in_battery + "h in battery" + " . Sunrise at " + loc_sunrise_float;

    } else {
            //loc_hours_til_sunset = 0;
        debugMessage = debugMessage + "\nDEBUG: Before lunch" ;
        //return false;
    }
 
    if(loc_hours_in_battery > loc_hours_til_next_sunrise) { 
        return true; 
    } else { 
        return false;
    }
}

/*
function makeItToNextBuyTime(loc_time_float, loc_HoursInBattery, loc_MinTimeIn_8h, loc_AdjBuySpotMinNext_8h, loc_adjSellPriceLast, local_lastSellTime, loc_GapToTrade){
    
    let hoursToNextMin = 0;
    
    // Is the price in 8h good enough?
    // using bestBuyNow(     current_hour,     adjBuyPriceNow,           last_sell_time,     adjSellPriceLast,     adj_sell_spot_max_next_8h, gapToTrade))
    let bestBuySoon = true;
//    bestBuySoon = bestBuyNow(loc_MinTimeIn_8h, loc_AdjBuySpotMinNext_8h, local_lastSellTime, loc_adjSellPriceLast, 0 , loc_GapToTrade);

    if(bestBuySoon){

        // Will we consume the battery before buy time?
        if(loc_time_float <= loc_MinTimeIn_8h){
            hoursToNextMin = loc_MinTimeIn_8h - loc_time_float;

        } else {
            hoursToNextMin = 24 - loc_time_float + loc_MinTimeIn_8h;
        }

        if(hoursToNextMin < loc_HoursInBattery){
            debugMessage = debugMessage + " makeItTo NextBuyTime.. Yes. hoursToNextMin " + hoursToNextMin + " and loc_HoursInBattery " + loc_HoursInBattery;
            return true;
        } else {
            debugMessage = debugMessage + " makeItTo NextBuyTime.. No. hoursToNextMin " + hoursToNextMin + " and loc_HoursInBattery " + loc_HoursInBattery;
            return false;
        }

    } else {
        debugMessage = debugMessage + " makeItTo NextBuyTime.. No. Next best buy is not good enough";
        return false;
    }
}
*/

function makeItToNextBuyTime2(HoursInBattery_loc, GapToTrade_loc, adjSellPriceNow_loc, adj_buy_spot_1h_loc, adj_buy_spot_2h_loc, adj_buy_spot_3h_loc, adj_buy_spot_4h_loc, adj_buy_spot_5h_loc, adj_buy_spot_6h_loc, adj_buy_spot_7h_loc){
    
    var timeToNextBuy = 100;
    if(     adjSellPriceNow_loc - adj_buy_spot_1h_loc >= GapToTrade_loc){  timeToNextBuy = 1; }
    else if(adjSellPriceNow_loc - adj_buy_spot_2h_loc >= GapToTrade_loc){  timeToNextBuy = 2; }
    else if(adjSellPriceNow_loc - adj_buy_spot_3h_loc >= GapToTrade_loc){  timeToNextBuy = 3; }
    else if(adjSellPriceNow_loc - adj_buy_spot_4h_loc >= GapToTrade_loc){  timeToNextBuy = 4; }
    else if(adjSellPriceNow_loc - adj_buy_spot_5h_loc >= GapToTrade_loc){  timeToNextBuy = 5; }
    else if(adjSellPriceNow_loc - adj_buy_spot_6h_loc >= GapToTrade_loc){  timeToNextBuy = 6; }
    else if(adjSellPriceNow_loc - adj_buy_spot_7h_loc >= GapToTrade_loc){  timeToNextBuy = 7; }
    else {  timeToNextBuy = 100; }
    
    debugMessage = debugMessage + "\n timeToNextBuy: " + timeToNextBuy
    + "\nadjSellPriceNow_loc: " + adjSellPriceNow_loc
    + "\nadj_buy_spot_1h_loc:"+ adj_buy_spot_1h_loc;

    if (timeToNextBuy <= HoursInBattery_loc) { return true; } 
    else { return false; }
}
    
/*function buyingBestNowComparedToNext8Hours(now,hour1,hour2,hour3,hour4,hour5,hour6,hour7){
    if(now == Math.min(now,hour1,hour2,hour3,hour4,hour5,hour6,hour7)){
        return true;
    } else return false;
}
*/

function bestBuyNow(hour_now_loc, price_now_loc, last_sell_time_loc, last_sell_price_loc, spot_max_next_8h_loc, gapToTrade_loc, adj_buy_spot_1h_loc, adj_buy_spot_2h_loc, adj_buy_spot_3h_loc, adj_buy_spot_4h_loc, adj_buy_spot_5h_loc, adj_buy_spot_6h_loc){
    
    if(price_now_loc < 0){ price_now_loc = 0; }

    let time_since_last_sell = 0;
    const forward_price_gap = spot_max_next_8h_loc - price_now_loc;
    const backward_price_gap = last_sell_price_loc - price_now_loc;
    if(last_sell_time_loc >= 40){
        time_since_last_sell = 40;
    } else if(hour_now_loc > last_sell_time_loc){
        time_since_last_sell = hour_now_loc - last_sell_time_loc;
    } else if (hour_now_loc < last_sell_time_loc){
        time_since_last_sell = hour_now_loc + 24 - last_sell_time_loc;
    } 

    //If falling spot next few hours..
    if(     price_now_loc > adj_buy_spot_1h_loc
        &&  price_now_loc > adj_buy_spot_2h_loc ){
            
        debugMessage = debugMessage + "\nNo buy. Better buy within hours.."
        + "\n adj_buy_spot_1h_loc: " + adj_buy_spot_1h_loc
        + "\n adj_buy_spot_2h_loc: " + adj_buy_spot_2h_loc;
        
        return false;
    }

    //If MUCH lower spot coming 8 hours..
    var reduced_price = (price_now_loc + 0.01)/2;

    if(price_now_loc < 0.15){
        debugMessage = debugMessage + " Under 0.15, buy up.. ";
        return true; 
    // Buy if can sell within 8h forward with enough price gap
    } else if(  reduced_price > adj_buy_spot_1h_loc
            ||  reduced_price > adj_buy_spot_2h_loc
            ||  reduced_price > adj_buy_spot_3h_loc 
            ||  reduced_price > adj_buy_spot_4h_loc 
            ||  reduced_price > adj_buy_spot_5h_loc
            ||  reduced_price > adj_buy_spot_6h_loc
    ){    
        debugMessage = debugMessage + "\nNo buy. MUCH lower spot coming 8 hours..";  
        return false;
    
    } else if(forward_price_gap > 0 && forward_price_gap > gapToTrade_loc){      
        debugMessage = debugMessage + " bestBuy expensive forward ";
        return true;  
    // Buy if have sold earlier to good price and now can buy back to low price
    } else if (time_since_last_sell > 0 && time_since_last_sell < 3 && backward_price_gap > 0 && backward_price_gap > gapToTrade_loc){     
        debugMessage = debugMessage + " bestBuy (have sold) " + " time_since_last_sell " + time_since_last_sell;
        return true;
    } else {
        //debugMessage = debugMessage +  " time_since_last_sell " + time_since_last_sell;
        return false;
    }
}

function bestSellNow(hour_now_loc, price_now_loc, last_buy_time_loc, last_buy_price_loc, spot_min_next_8h_loc, gapToTrade_loc, adj_sell_spot_1h_loc, adj_sell_spot_2h_loc, adj_sell_spot_3h_loc, loc_ehub_off_season){
    let time_since_last_buy = 0;
    const forward_price_gap = price_now_loc - spot_min_next_8h_loc;
    var backward_price_gap = price_now_loc - last_buy_price_loc;
    
    if(loc_ehub_off_season == 1){ backward_price_gap = 0;}

    if(last_buy_time_loc >= 40){
        time_since_last_buy = 40;
    } else if(hour_now_loc > last_buy_time_loc){
        time_since_last_buy = hour_now_loc - last_buy_time_loc;
    } else if (hour_now_loc < last_buy_time_loc){
        time_since_last_buy = hour_now_loc + 24 - last_buy_time_loc;
    } 

    //Should wait as there are better prices all hours to come
    if(     price_now_loc < adj_sell_spot_1h_loc
        &&  price_now_loc < adj_sell_spot_2h_loc
        &&  price_now_loc < adj_sell_spot_3h_loc){
            
        debugMessage = debugMessage + "No sell. Better sell hours to come."
        + "\nadj_sell_spot_1h_loc: " + adj_sell_spot_1h_loc
        + "\nadj_sell_spot_2h_loc: " + adj_sell_spot_2h_loc
        + "\nadj_sell_spot_3h_loc: " + adj_sell_spot_3h_loc;
        
        return false;
    }
    // Sell if can buy back in 8h.
    if(forward_price_gap > 0 && forward_price_gap > gapToTrade_loc){ 
        debugMessage = debugMessage + "bestSell cheap forward forward_price_gap " + forward_price_gap + " hour_now_loc " + hour_now_loc + " last_buy_time_loc " + last_buy_time_loc + " time_since_last_buy " + time_since_last_buy;
        return true;
    // Sell again if bought cheap within 10 hours before and now can sell more expensive
    } else if (time_since_last_buy > 0 && time_since_last_buy < 10 && backward_price_gap > gapToTrade_loc){     
        debugMessage = debugMessage + "bestSell (have bought)  ";
        return true;
    } else {
        //debugMessage = debugMessage + " backward_price_gap " + backward_price_gap + " hour_now_loc " + hour_now_loc + " last_buy_time_loc " + last_buy_time_loc + " time_since_last_buy " + time_since_last_buy;
        return false;
    }
}

function AdjustedBuyPrice (price_now, fixed_markup, variable_markup){
    var adj_buy = 0;
    if(price_now < 0){ price_now = 0; }

    if (price_now > 0){
        adj_buy = (price_now * variable_markup) + fixed_markup;
        //debugMessage = debugMessage + " adj_buy " + adj_buy + " fixed_markup " +fixed_markup + " variable_markup " +variable_markup;
    } else {
        //adj_buy = price_now + fixed_markup;
        adj_buy = fixed_markup;
        //debugMessage = debugMessage + " adj_buy " + adj_buy + " fixed_markup " +fixed_markup;
    }
    adj_buy = adj_buy.toFixed(2);
    return adj_buy;
}

function AdjustedSellPrice (price_now, fixed_markup, variable_markup){
    var adj_sell = 0;
    if(price_now < 0){ price_now = 0; }

    if(price_now > 0){
        adj_sell = (price_now * variable_markup) + fixed_markup;
        //debugMessage = debugMessage + " adj_sell " + adj_sell + " fixed_markup " +fixed_markup + " variable_markup " +variable_markup;
        
    } else {
        adj_sell = price_now + fixed_markup;
        //debugMessage = debugMessage + " adj_sell " + adj_sell + " fixed_markup " +fixed_markup;
    }
    adj_sell = adj_sell.toFixed(2);
    return adj_sell;
}

function AddMessage(addSpot, addAdjBuy, addAdjSell
    , addLastBuy, addAdjLastBuy, addLastBuyTime
    , addLastSell, addAdjLastSell, addLastSellTime
    , addSpotMaxIn8h, addAdjSellSpotMaxIn8h, addSpotMaxTimeIn8h
    , addSpotMinIn8h, addAdjBuySpotMinIn8h, addSpotMinTimeIn8h
    , addGapToTrade, addwillMakeItToNextBuy, addwillMakeTheNight, additIsBestSellTimeNow, additIsBestBuyTimeNow, 
    addSOC, addPPV){
    var local_string = "";
    var sell_time_text = "";
    var buy_time_text = "";    
    var forward_buy_price_gap = addAdjSellSpotMaxIn8h - addAdjBuy;
    var forward_sell_price_gap = addAdjSell - addAdjBuySpotMinIn8h;
    var backward_buy_price_gap = 0;
    var backward_sell_price_gap = 0;

    if(addLastBuyTime >= 40){
        backward_sell_price_gap = 0;
        buy_time_text = " (old)";
    } else {
        //backward_sell_price_gap = addAdjLastSell - addAdjBuy;
        backward_sell_price_gap = addAdjSell - addAdjLastBuy;
        //buy_time_text = " (Last buy time "+ addLastBuyTime + " ,adj last buy price: " + addAdjLastBuy + ")";
        buy_time_text = " at " + addLastBuyTime;
    }

    if(addLastSellTime >= 40){
        backward_buy_price_gap = 0;
        sell_time_text = " (old)";
    } else {
        backward_buy_price_gap = addAdjLastSell - addAdjBuy;
        //sell_time_text = " (Last sell time "+ addLastSellTime + " ,adj last sell price: " + addAdjLastSell + ")";
        sell_time_text = " at " + addLastSellTime;
    }

    forward_buy_price_gap = forward_buy_price_gap.toFixed(3);
    backward_buy_price_gap = backward_buy_price_gap.toFixed(3);
    forward_sell_price_gap = forward_sell_price_gap.toFixed(3);
    backward_sell_price_gap = backward_sell_price_gap.toFixed(3);

    local_string = 
      "\n SOC: " + addSOC
    + "\n PPV: " + addPPV
    + "\n Spot: " + addSpot

    + "\n\n forw buy: " + forward_buy_price_gap
    + "\n backw buy: " + backward_buy_price_gap
    + "\n forw sell: " + forward_sell_price_gap
    + "\n backw sell: " + backward_sell_price_gap 
   // + " Last buy: " + addLastBuy
   // + " Last sell: " + addLastSell
    
    + "\n\n Real buy price: " + addAdjBuy
    + "\n coming max " + addAdjSellSpotMaxIn8h + " kr at" + addSpotMaxTimeIn8h
    + "\n last max " + addAdjLastSell + " kr" + sell_time_text
    + "\n\n Real sell price: " + addAdjSell 
    + "\n coming min " + addAdjBuySpotMinIn8h + " kr at " + addSpotMinTimeIn8h
    + "\n last min " + addAdjLastBuy + " kr" + buy_time_text

    + "\n\n WillMakeItToNextBuy: "  + addwillMakeItToNextBuy
    + "\n WillMakeTheNight: "       + addwillMakeTheNight
    + "\n BestSellTimeNow: "        + additIsBestSellTimeNow 
    + "\n BestBuyTimeNow: "         + additIsBestBuyTimeNow
    
    + "\n\n addGapToTrade: " + addGapToTrade;

    return local_string; 
}

function AddBuyMessage(addSpot, addAdjBuy
    , addAdjLastSell, addLastSellTime
    , addAdjSellSpotMaxIn8h
    , addGapToTrade){
    var local_string = "";
    
    local_string = 
    "\n Spot: " + addSpot
    + "\n  Adjusted buy price: " + addAdjBuy
    + "\n  (adj last sell: " + addAdjLastSell + ","
    + "\n  max adj sell in 8h: " + addAdjSellSpotMaxIn8h + ")"; 
     
    if(addLastSellTime >= 40) {
        local_string = local_string + "\n  (Last sell time is old)";
    } else {
        local_string = local_string + "\n  (Last sell time "+ addLastSellTime + ") ";
    }
    
    local_string = local_string 
    + "\n  Needed price gap "+ addGapToTrade;   

    return local_string; 
}

function AddSellMessage(addSpot, addAdjSell
    , addAdjLastBuy, addLastBuyTime
    , addAdjBuySpotMinIn8h
    , addGapToTrade){
    
    var local_string    = "";
    var buy_time_text   = "";    
    var forward_sell_price_gap  = addAdjSell - addAdjBuySpotMinIn8h;
    var backward_sell_price_gap = 0;

    if(addLastBuyTime >= 40){
        backward_sell_price_gap = 0;
        buy_time_text = " (old)";
    } else {
        backward_sell_price_gap = addAdjSell - addAdjLastBuy;
        buy_time_text = " at " + addLastBuyTime;
    }

    forward_sell_price_gap = forward_sell_price_gap.toFixed(3);
    backward_sell_price_gap = backward_sell_price_gap.toFixed(3);
    
    local_string = 
    + "\n forw sell: " + forward_sell_price_gap
    + "\n backw sell: " + backward_sell_price_gap 
    + "\n Spot: " + addSpot
    + "\n  Adjusted sell price: " + addAdjSell 
    + "\n  (adj last buy: " + addAdjLastBuy + ","
    + "\n  min adj buy in 8h: " + addAdjBuySpotMinIn8h + ")"; 
    
    if(addLastBuyTime >= 40) {
        local_string = local_string + "\n  (Last buy time is old)";
    } else {
        local_string = local_string + "\n  (Last buy time "+ addLastBuyTime + ") ";
    } 
    
 //   local_string = local_string 
 //   + "\n  Needed price gap "+ addGapToTrade;   

    return local_string; 
}

// ALWAYS DO THIS:
//      - End active buy/charge if soc above 98%, return automation to EHUB Self Consumption 
//      - End active sell/discharge if soc below 15%, return automation to EHUB Self Consumption 
//      - Use the spot price, but calculate what the actual buy and sell price is to you with fixed and variable markups
// Do separate depending on time per day:
//      ->>  Calculate the night length and do decision based on ppv hours per day
//      ->>  Record when ppv hours starts and stop 

// Use decision time periods:
//  1. 00- ppv time starts 
//              - If ridiculously low spot, always charge
//              - Make the night witout charging? 
//                  Yes:    Do nothing
//                  No:     Find best buy time
//                  (Pros: With long days and sun charging, nothing needs to be bougt from grid)
//                  (Cons: With long nights there will be no trading and charging.
//                      Then better to buy up battery night time: Run Buy/Sell if revenue in it.)

//  2. ppv time starts - x before time ppv falls  
//              - If ridiculously low spot, always charge
//                      Separate buy and sell decisions:
//                          Buy:   Only buy if have sold or able to sell in ca 8h.
//                          Sell:  Sell pricy             

//  3. x before ppv falls, 
//              - If ridiculously low spot, always charge
//              - Buy/sell 
//                  Sell:    Sell pricy (but not more than make it to morning or next buy time or daytime)
//                  Buy:     Find best buy time (and also buy if car charges)
  
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