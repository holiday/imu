var init = function() {

    /* List serial devices */
    var select, option, device, conId, disconnected, stringReceived, cube1, cube2, cube3, cube4;
    select = document.getElementById('devices');
    disconnected = document.getElementById('disconnect');

    chrome.serial.getDevices(function(devices) {
        
        devices.each(function(port) {
            option = document.createElement("option");
            option.value = port.path;
            option.text = port.path;
            select.add(option);
        });
    });

    /*Select serial device change */
    select.onchange = function(e) {
        device = select.options[select.selectedIndex].value;
        chrome.serial.connect(device, {bitrate: 115200, dataBits: "eight", parityBit: "no", stopBits: "one"}, onConnect)
        
    }

    var onConnect = function(connectionInfo) {
        console.log("connected");
        conId = connectionInfo.connectionId;
        disconnected.disabled = false;

        disconnected.addEventListener("click", function(e) {
            e.preventDefault();
            chrome.serial.disconnect(conId, function(result){
                if(result){
                    disconnected.disabled = true;
                    console.log("disconnected");
                }
            });
        },false);

        //listen for data
        chrome.serial.onReceive.addListener(onReceiveCallback);
        
    }

    var ab2str = function(buf) {
      var bufView = new Uint8Array(buf);
      var encodedString = String.fromCharCode.apply(null, bufView);
      return decodeURIComponent(escape(encodedString));
    };


    stringReceived = '';
    cube1 = document.getElementById("cube-1");
    cube2 = document.getElementById("cube-2");
    cube3 = document.getElementById("cube-3");
    cube4 = document.getElementById("cube-4");

    var onReceiveCallback = function(info) {
        if (info.connectionId == conId && info.data) {
            var str = ab2str(info.data);
            var data;
            if(str.charAt(str.length-1) === '\n'){
                stringReceived += str.substring(0, str.length-1);
                data = stringReceived.split(",");
                cube1.style.webkitTransform = "rotateX(" + (-data[0] - 180) + "deg) rotateZ(" + (data[1] - 180) + "deg)";
                cube2.style.webkitTransform = "rotateX(" + (-data[2] - 180) + "deg) rotateZ(" + (data[3] - 180) + "deg)";
                cube3.style.webkitTransform = "rotateX(" + (-data[4] - 180) + "deg) rotateZ(" + (data[5] - 180) + "deg)";
                cube4.style.webkitTransform = "rotateX(" + (-data[6] - 180) + "deg) rotateZ(" + (data[7] - 180) + "deg)";
                
                //console.log("x: ", xy[4], "y: ", xy[5]);
                stringReceived = '';
            }else {
                stringReceived += str;
            }
        }
    }
  
};
  
window.addEventListener( 'DOMContentLoaded', init, false);