var GUI = (function ($) {

    function GUI(){
        var self = this; //prevent namespace conflicts with "this" in closures
        /* List serial devices */
        self.select_devices;
        self.arduino_console;
        self.send_lock;
        self.init_pwm_btn;
        self.option;
        self.device;
        self.conId;
        self.disconnect;
        self.stringReceived;
        self.cube1;
        self.cube2; 
        self.cube3;
        self.cube4;

        self.north_motor_speed;
        self.south_motor_speed;

        self.stringReceived     = "";
        self.send_lock          = 1; //1 = you can send, 0 = you cant
        self.select_devices     = $('#select-devices');
        self.disconnect         = $('#disconnect');
        self.init_pwm_btn       = $('#init_pwm');
        self.stop_pwm_btn       = $('#stop_pwm');
        self.throttle_high      = $('#throttle_high');
        self.throttle_low       = $('#throttle_low');
        self.north_motor_slider = $('#north-motor');
        self.north_motor_value  = $('#north-motor-value');
        self.south_motor_slider = $('#south-motor');
        self.south_motor_value  = $('#south-motor-value')
        self.arduino_console    = $('#console');
        self.data_rec           = [];
        self.cube1              = $("#cube-1");
        self.cube2              = $("#cube-2");
        self.cube3              = $("#cube-3");
        self.cube4              = $("#cube-4");

        /*************************/
        /* Listen for GUI Events */
        /*************************/

        /*load all serial devices on serial port*/
        self.get_devices(self);

        /*Select serial device change */
        self.select_devices.change(function(e) {
            
            self.device = self.select_devices.find(":selected").text();

            chrome.serial.connect(self.device, {
                bitrate: 115200,
                dataBits: "eight",
                parityBit: "no",
                stopBits: "one"
            }, function(connectionInfo){
                self.on_connect(self, connectionInfo);
            });
        });

        /*init pwm */
        self.init_pwm_btn.click(function(e){
            e.preventDefault();
            self.send_message(self, "init_pwm");
        });

        /*flatline pulses*/
        self.stop_pwm_btn.click(function(e){
            e.preventDefault();
            self.send_message(self, "stop_pwm");
        });

        /*send a high throttle signal*/
        self.throttle_high.click(function(e){
            e.preventDefault();
            self.send_message(self, "throttle_high");
        });

        /*send a low throttle signal*/
        self.throttle_low.click(function(e){
            e.preventDefault();
            self.send_message(self, "throttle_low");
        });

        /*listen for motor north slider*/
        self.north_motor_slider.change(function(e){
            self.north_motor_value.text(e.currentTarget.value);
            self.send_message(self, "set_speed_north: " + e.currentTarget.value);
        });

        /*listen for motor south slider*/
        self.south_motor_slider.change(function(e){
            self.south_motor_value.text(e.currentTarget.value);
            self.send_message(self, "set_speed_south: " + e.currentTarget.value);
        });
    }

    GUI.prototype.on_connect = function(self, connectionInfo) {
        self.conId = connectionInfo.connectionId;
        self.arduino_console_log(self, "Serial Connected (" + self.conId + ")")
        self.disconnect.attr("disabled", false);

        self.disconnect.click(function(e) {
            e.preventDefault();
            chrome.serial.disconnect(self.conId, function (result) {
                if (result) {
                    self.disconnect.attr("disabled", true);
                    self.arduino_console_log(self, "Successfully Disconnected");
                }
            });
        });

        //listen for data
        chrome.serial.onReceive.addListener(function(info) {
            self.on_receive_callback(self, info);
        });
    };

    GUI.prototype.is_connected = function(self) {
        return self.conId > 0;
    };

    GUI.prototype.arduino_console_log = function(self, msg) {
        self.arduino_console.val(self.arduino_console.val() + '\n' + '>' + msg);
        //scroll console to bottom
        self.arduino_console.scrollTop(self.arduino_console[0].scrollHeight - self.arduino_console.height());
    };

    GUI.prototype.get_devices = function(self) {
        
        chrome.serial.getDevices(function (devices) {
            $.each(devices, function (k,port) {
                self.select_devices.append($('<option>', {
                    value: port.path,
                    text: port.path
                }));
            });
        });
    };
    
    GUI.prototype.send_message = function(self, str) {
        if(self.conId && self.send_lock){
            self.send_lock = 0; //prevent button spamming
            chrome.serial.send(self.conId, self.str2ab(str+'\n'), function(sendInfo){
                if(sendInfo.bytesSent > 0){
                    self.arduino_console_log(self, str);
                }
                self.send_lock = 1;
            });
        }else{
            self.arduino_console_log(self, "Error, you are not connected");
        }
    };

    GUI.prototype.ab2str = function (buf) {
        var bufView = new Uint8Array(buf);
        var encodedString = String.fromCharCode.apply(null, bufView);
        return decodeURIComponent(escape(encodedString));
    };

    /* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
    GUI.prototype.str2ab = function(str) {
        var encodedString = unescape(encodeURIComponent(str));
        var bytes = new Uint8Array(encodedString.length);
        for (var i = 0; i < encodedString.length; ++i) {
            bytes[i] = encodedString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    GUI.prototype.on_receive_callback = function (self, info) {

        if (info.connectionId == self.conId && info.data) {
            var str = self.ab2str(info.data);
            if (str.charAt(str.length - 1) === '\n') {
                //strip out newline char
                self.stringReceived += str.substring(0, str.length - 1);

                if(self.stringReceived.substring(0, 6) == "Data: " && self.stringReceived.length <= 62){
                    //split on comma
                    self.data_rec = self.stringReceived.substring(6).split(",");
                    //graph data
                    self.cube1.css("-webkitTransform", "rotateX(" + (-self.data_rec[0] - 180) + "deg) rotateZ(" + (self.data_rec[1] - 180) + "deg)");
                    self.cube2.css("-webkitTransform", "rotateX(" + (-self.data_rec[2] - 180) + "deg) rotateZ(" + (self.data_rec[3] - 180) + "deg)");
                    self.cube3.css("-webkitTransform", "rotateX(" + (-self.data_rec[4] - 180) + "deg) rotateZ(" + (self.data_rec[5] - 180) + "deg)");
                    self.cube4.css("-webkitTransform", "rotateX(" + (-self.data_rec[6] - 180) + "deg) rotateZ(" + (self.data_rec[7] - 180) + "deg)");
                }else{
                    self.arduino_console_log(self, self.stringReceived);
                }

                self.stringReceived = '';
                
            } else {
                self.stringReceived += str;
            }
        }

        self.data_rec = [];
    };

    return GUI;

})(jQuery);



window.addEventListener('DOMContentLoaded', function(){
    var gui = new GUI();
}, false);