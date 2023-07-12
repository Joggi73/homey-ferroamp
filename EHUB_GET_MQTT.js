if (args[0] == undefined) {
console.log ('Missing argument looser')
return false;
}

let bl = await Homey.apps.getApp({ id: 'net.i-dev.betterlogic' } );
if (!bl) {
console.error('Better Logic not installed!')
return false;
}

// Get the json message from EHUB
const flow_args = JSON.parse(args[0]);

let bl_sensor_ehub_ppv = "bl_sensor_ehub_ppv";          // SOLAR POWER [w] as shown in Ferroamp Cloud Dashboard
let bl_sensor_ehub_sext = "bl_sensor_ehub_sext";        //GRID POWER? [w] or Selling to Grid ?
let bl_sensor_ehub_pext_tot = "bl_sensor_ehub_pext_tot";    // Grid power ALL [w]
let bl_sensor_ehub_pload_tot = "bl_sensor_ehub_pload_tot";    // Load power ALL [w]
let bl_sensor_ehub_pbat = "bl_sensor_ehub_pbat";        //Battery power
// Calculations
    var var_pload_1 = parseFloat(flow_args.pload.L1);
    var var_pload_2 = parseFloat(flow_args.pload.L2);
    var var_pload_3 = parseFloat(flow_args.pload.L3);
    var var_pload_tot = var_pload_1 + var_pload_2 + var_pload_3;

    var var_pext_1 = parseFloat(flow_args.pext.L1);
    var var_pext_2 = parseFloat(flow_args.pext.L2);
    var var_pext_3 = parseFloat(flow_args.pext.L3);
    var var_pext_tot = var_pext_1 + var_pext_2 + var_pext_3;

    var var_pbat = parseFloat(flow_args.pbat.val);

let BLApp = await Homey.apps.getApp({id:"net.i-dev.betterlogic" }); 

await BLApp.apiPut("/" + bl_sensor_ehub_ppv + "/" + parseFloat(flow_args.ppv.val));
await BLApp.apiPut("/" + bl_sensor_ehub_sext + "/" + parseFloat(flow_args.sext.val));
await BLApp.apiPut("/" + bl_sensor_ehub_pext_tot + "/" + var_pext_tot);
await BLApp.apiPut("/" + bl_sensor_ehub_pload_tot + "/" + var_pload_tot);
await BLApp.apiPut("/" + bl_sensor_ehub_pbat + "/" + var_pbat);

return true;