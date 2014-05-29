/*
  Motors.cpp - Library for running motors on 20A ESC using 16 bit Timer1.
  Created by Rashaad Ramdeen, May 2014.
*/
#include "Arduino.h"
#include "Motors.h"

Motors::Motors(int north_pin, int south_pin, int frequency_hz, int esc_low, int esc_high)
{
	pinMode(north_pin, OUTPUT);
	pinMode(south_pin, OUTPUT);
	_north_pin = north_pin;
	_south_pin = south_pin;
	_icr1 = (16000000/(frequency_hz * 8)) - 1;
	_esc_low = _esc_low;
	_esc_high = _esc_high;
}

void Motors::init_pwm()
{
	// Top = [ (cpu_clk_speed Hz / (frequency Hz * prescaled) ] - 1
	//so for Arduino Uno running at 16Mhz, we want a 100Hz frequency 
	//Top = 16000000/(100 * 8) - 1 = 19999 

	//Fast Pwm, inverted mode, 100Hz, prescaler 8
	TCCR1A = _BV(WGM11) | _BV(COM1A1) | _BV(COM1A0) | _BV(COM1B1) | _BV(COM1B0);
	TCCR1B = _BV(WGM13) | _BV(WGM12) | _BV(CS11);

	//one period (Top value)
	ICR1 = _icr1;

	Motors::stop_pwm();
}

void Motors::stop_pwm(){
	//pin goes HIGH on this count, since its 0, it will fire on the very first
	//count so essentially this gives us 5v constant
	OCR1A = ICR1;
	OCR1B = ICR1;
}

void Motors::throttle_high(){
	//HIGH throttle (~2ms pulse)
	OCR1A = ICR1 - _esc_high;
	OCR1B = ICR1 - _esc_high;
}

void Motors::throttle_low(){
	//LOW throttle (~1ms pulse)
	OCR1A = ICR1 - _esc_low;
	OCR1B = ICR1 - _esc_low;
}

void Motors::set_speed_north(float percent) {
	_north_speed = _esc_low + (int)(percent * (_esc_high - _esc_low));
	OCR1A = ICR1 - _north_speed;
}

void Motors::set_speed_south(float percent) {
	_south_speed = _esc_low + (int)(percent * (_esc_high - _esc_low));
	OCR1B = ICR1 - _south_speed;
}