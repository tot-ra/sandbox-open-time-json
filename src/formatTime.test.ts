import {formatTime} from './formatTime';

it('formats midnight', ()=>{
  expect(formatTime(0)).toEqual('12 AM');
  expect(formatTime(23*60*60 + 59*60 + 59)).toEqual('11:59:59 PM');
  expect(formatTime(1)).toEqual('12:00:01 AM');
})

it('formats 1AM', ()=>{
  expect(formatTime(60*60)).toEqual('1 AM');
})

it('formats 8AM', ()=>{
  expect(formatTime(8*60*60)).toEqual('8 AM');
  expect(formatTime(8*60*60-1)).toEqual('7:59:59 AM');
  expect(formatTime(8*60*60+60)).toEqual('8:01 AM');
})

it('formats midday', ()=>{
  expect(formatTime(12*60*60-1)).toEqual('11:59:59 AM');
  expect(formatTime(12*60*60)).toEqual('12 PM');
  expect(formatTime(12*60*60+1)).toEqual('12:00:01 PM');
})

