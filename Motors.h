/*
  Motors.h - Library for running motors on 20A ESC using 16 bit Timer1.
  Created by Rashaad Ramdeen, May 2014.
*/

#ifndef Motors_h
#define Motors_h

#include "Arduino.h"

class Motors
{
	public:
		int _north_speed;
		int _south_speed;

		Motors(int north_pin, int south_pin, int frequency_hz, int esc_low, int esc_high);
		void init_pwm();
		void stop_pwm();
		void throttle_high();
		void throttle_low();
		void set_speed_north(float percent);
		void set_speed_south(float percent);

	private:
		int _esc_low;
		int _esc_high;
		int _north_pin;
		int _south_pin;
		int _icr1;
};

#endif