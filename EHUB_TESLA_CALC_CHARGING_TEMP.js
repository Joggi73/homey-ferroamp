// This script evaluates if the car needs charging and tries to 
// use sun without taking from battery.

//  If solar power available use it to fill up daytime with suitable current (this script)
//  If schedule set calculate number of hours needed to fill up
//  If no solar power, use power by the hour to start charging.

// Make sure BetterLogic is installed
let bl = await Homey.apps.getApp({ id: 'net.i-dev.betterlogic' } );
if (!bl) {
console.error('Better Logic not installed!')
return false;
}
// First create the following numeric variables in BetterLogic
//Then bring them into the script 
// Read variables
const bl_time = "bl_time";    
const bl_tesla_soc = "bl_tesla_soc";                      // Tesla SOC
const bl_tesla_charge_level = "bl_tesla_charge_level";    // Tesla sharge limit from Tesla app
const bl_sensor_ehub_ppv = "bl_sensor_ehub_ppv";          // Active Buy/sell switch on/off
const bl_sensor_ehub_pload_tot = "bl_sensor_ehub_pload_tot";
const bl_ehub_esm_soc = "bl_ehub_esm_soc";          // State Of Charge for battery [%]
const bl_sensor_ehub_pext_tot = "bl_sensor_ehub_pext_tot";
const bl_sensor_ehub_pbat = "bl_sensor_ehub_pbat";   // Power from battery. Positive out
const bl_tesla_best_charge_hour_now = "bl_tesla_best_charge_hour_now";    // 1 means this hour is one of the best charging hours
// Write variables
const bl_tesla_charge_on = "bl_tesla_charge_on";
const bl_tesla_charge_current = "bl_tesla_charge_current";  // Current decision if to trade today or not
const bl_tesla_message_to_user = "bl_tesla_message_to_user";
const bl_tesla_hours_to_fill_up_car = "bl_tesla_hours_to_fill_up_car";
const bl_spot = "bl_spot";            // Prices from Power by the hour
const bl_ehub_fixed_markup_buy = "bl_ehub_fixed_markup_buy";          // From example below: 0.1
const bl_ehub_variable_markup_buy = "bl_ehub_variable_markup_buy";    // From example below: 1.25


//get Better Logic variables
let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" });
let temp1 = await BLApp.apiGet(bl_time);
    let time = temp1.value;
    let current_hour = parseFloat(time.substr(0,2));
    let current_minute = parseFloat(time.substr(3,2));
    let time_float = current_hour + current_minute/60;
let temp2 = await BLApp.apiGet(bl_tesla_soc);
    let tesla_soc = parseFloat(temp2.value);
let temp3 = await BLApp.apiGet(bl_tesla_charge_level);
    let tesla_charge_limit = parseFloat(temp3.value);
    tesla_charge_limit = tesla_charge_limit.toPrecision(2);    
let temp4 = await BLApp.apiGet(bl_sensor_ehub_ppv);
    let ppv = parseFloat(temp4.value)/1000;
    ppv = ppv.toPrecision(3);
let temp5 = await BLApp.apiGet(bl_sensor_ehub_pload_tot);
    let pload = parseFloat(temp5.value)/1000;
    pload = pload.toPrecision(3);
let temp6 = await BLApp.apiGet(bl_ehub_esm_soc);
    let soc = parseFloat(temp6.value);
let temp7 = await BLApp.apiGet(bl_sensor_ehub_pext_tot);
    let pext = parseFloat(temp7.value)/1000;
    pext = pext.toPrecision(3);
let temp8 = await BLApp.apiGet(bl_sensor_ehub_pbat);
    let pbat = parseFloat(temp8.value)/1000;
    pbat = pbat.toPrecision(3);
let bestChargetimeNow = 0;
    let temp9 = await BLApp.apiGet(bl_tesla_best_charge_hour_now);
    bestChargetimeNow = parseFloat(temp9.value);  
    
let temp36a = await BLApp.apiGet(bl_ehub_fixed_markup_buy);
    let fixed_markup_buy = parseFloat(temp36a.value);
let temp38a = await BLApp.apiGet(bl_ehub_variable_markup_buy);
    let variable_markup_buy = parseFloat(temp38a.value);


    let temp24 = await BLApp.apiGet(bl_spot);
    let priceNow = 0;
    priceNow =parseFloat(temp24.value);
    if(priceNow < 0){ priceNow = 0; } // Do not allow negative pricing incalculations

    let adjBuyPriceNow = AdjustedBuyPrice(priceNow, fixed_markup_buy, variable_markup_buy);
    adjBuyPriceNow = parseFloat(adjBuyPriceNow);


let tesla_needs_charging = false;
let tesla_charge_on = 0;
let asked_load_current = 0;
let hours_to_fill_up_car = 0;
// let asked_load_current2 = 0;
let messageToTeslaUser = "..";
    
if (tesla_soc < tesla_charge_limit - 3) { tesla_needs_charging = true; }

hours_to_fill_up_car = HoursToFillUp(tesla_soc, tesla_charge_limit);

if(tesla_needs_charging == true){
    // First daytime. Charge up when sun.
    //if(current_hour >= 8 && current_hour <= 20 && ppv > 2){
    if(tesla_soc < 20){ // Always charge the car up to minimum 20%
        
        tesla_charge_on = 2;    // 2 = Use grid power
        asked_load_current = 16;
        messageToTeslaUser = "0a. Charging to low ("+ tesla_soc + "). Charge to 20.  Asked current:" + asked_load_current + "hours_to_fill_up_car: " + hours_to_fill_up_car; 

    } else if(adjBuyPriceNow <= 0.3){
        tesla_charge_on = 2;    // 2 = Use grid power
        asked_load_current = 16;
        messageToTeslaUser = "0b. Cheap hours. Just charge! SOC: "+ tesla_soc + ". Asked current:" + asked_load_current + " adjBuyPriceNow:" + adjBuyPriceNow; 

    } else if (ppv > 2){

        tesla_charge_on = 1;    // 1 = Use solar power
        asked_load_current = AdjustChargeCurrentOnPPV(ppv);
        messageToTeslaUser = "1a. Panels charge car! Asked current:" + asked_load_current + " ppv " + ppv +". Pload " + pload + ". tesla_soc " + tesla_soc + ". Car needs: "+ tesla_charge_limit + "hours_to_fill_up_car: " + hours_to_fill_up_car; 
    
    } else if (bestChargetimeNow == 1 && (tesla_soc < tesla_charge_limit - 5)){

        tesla_charge_on = 2;    // 2 = Use grid power now
        asked_load_current = 16;
        messageToTeslaUser = "1b. Best charge hours is now. Use grid. Hours to fill up: " + hours_to_fill_up_car + "h. Actual car SOC: " + tesla_soc + ". Car needs: "+ tesla_charge_limit; 
    
    } else {
        tesla_charge_on = 0;    // 0 = Dont charge
        asked_load_current = 16;
         messageToTeslaUser = "2. Tesla needs charging but dont charge now! Actual car SOC: " + tesla_soc + ". Car needs: "+ tesla_charge_limit + ". pext:" + pext + " adjBuyPriceNow: " + adjBuyPriceNow; 
    }
} else {
    tesla_charge_on = 0;    // 0 = Dont charge
    asked_load_current = 16;
    messageToTeslaUser = "3. Tesla needs NO charging! Actual car SOC: " + tesla_soc + ". Car needs: "+ tesla_charge_limit + ". pext:" + pext; 
}

// asked_load_current2 = AdjustChargeCurrentOnPPV2(ppv, pext, pbat);
// asked_load_current2 = AdjustChargeCurrentOnPPV(ppv);
//messageToTeslaUser = messageToTeslaUser + " asked_load_current2: " + asked_load_current2 + " pbat: "+pbat;

let result2 = await BLApp.apiPut("/" + bl_tesla_charge_on + "/" + tesla_charge_on ); 
let result1 = await BLApp.apiPut("/" + bl_tesla_charge_current + "/" + asked_load_current ); 
let result3 = await BLApp.apiPut("/" + bl_tesla_hours_to_fill_up_car + "/" + hours_to_fill_up_car ); 
let result4 = await BLApp.apiPut("/" + bl_tesla_message_to_user + "/" + messageToTeslaUser ); 

return;

function AdjustChargeCurrentOnPPV(ppv_in){
    let calc_load_current = ppv_in*1000/(230*3)- 1 ;
    //calc_load_current = calc_load_current.toPrecision(2);
    calc_load_current = Math.round(calc_load_current);
    if(calc_load_current > 13) { calc_load_current = 13; }
    if(calc_load_current < 3)  { calc_load_current =  3; }
    return calc_load_current;
}

function AdjustChargeCurrentOnPPV2(ppv_now, grid_pext_now, ehub_charging_power){
//  Take all solar power to the car, without buying/increasing grid electricity if not going to battery.
//  Car power should be solar power minus bought from grid..and..battery..
// Grid positive is buying/importing. Grid negative is selling/exporting.
    let calc_pext = 0;
    if(grid_pext_now >= 0){calc_pext = 0;}
        else{ calc_pext = grid_pext_now;}
    
//    let calc_load_current2 = (ppv_now - calc_pext)*1000/(230*3)- 1 ;
    let calc_load_current2 = (ppv_now - calc_pext)*1000/(230*3);
    calc_load_current2 = calc_load_current2.toPrecision(2);
 //   calc_load_current2 = Math.round(calc_load_current2);
 //   if(calc_load_current2 > 13) { calc_load_current2 = 13; }
 //   if(calc_load_current2 < 3)  { calc_load_current2 =  3; }
    
    return calc_load_current2;
}

function BestBuyHoursBeforeReadyTime(now,hour1,hour2,hour3,hour4,hour5,hour6,hour7){
    if(now = Math.min(now,hour1,hour2,hour3,hour4,hour5,hour6,hour7)){
        return true;
    } else return false;
}

function HoursToFillUp(loc_car_soc, loc_car_set_charge_limit){
    
    var fillup_rate = 15; //[SOC%/hour], 75km/h at 16A makes -> 15%/hour
    let hours_left = 0;

    if(loc_car_set_charge_limit > loc_car_soc){
        hours_left = (loc_car_set_charge_limit - loc_car_soc) / fillup_rate;
    } else {
        hours_left = 0;
    }
    hours_left = Math.round(hours_left);

    return hours_left;
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
