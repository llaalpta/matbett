// Definición de los objetos
const mainForm = {
  stake: 123,
  odds: 1.87,
  comission: 0,
  refundValue: 123,
  refundRatio: 75,
  profit: 0,
  risk: 0,
  winBalance: 0,
  prepayment: true,
  newOdds: 0,
};

const line1 = {
  event: 'Event 1',
  market: 'Market 1',
  selection: 'Selection 1',
  odds: 1.83,
  status: 'pending',
};

const line2 = {
  event: 'Event 2',
  market: 'Market 2',
  selection: 'Selection 2',
  odds: 2,
  status: 'pending',
};

const line3 = {
  event: 'Event 3',
  market: 'Market 3',
  selection: 'Selection 3',
  odds: 1.5,
  status: 'pending',
};

const combinedMainForm = {
  stake: 10,
  odds: line3.odds === 0 ? line1.odds * line2.odds : line1.odds * line2.odds * line3.odds,
  comission: 0,
  refundValue: 10,
  refundRatio: 75,
  profit: 0,
  risk: 0,
  winBalance: 0,
  prepayment: false,
};

const main2Form = {
  stake: 0,
  odds: 1.66,
  comission: 0,
  profit: 0,
  risk: 0,
  winBalance: 0,
};

const hedge1Form = {
  stake: 0,
  odds: 1.73,
  comission: 6,
  profit: 0,
  risk: 0,
  winBalance: 0,
  unmatched: 0,
  cancelledStake: 0,
};

const hedge2Form = {
  stake: 0,
  odds: 1.77,
  comission: 2,
  profit: 0,
  risk: 0,
  winBalance: 0,
  unmatched: 0,
  cancelledStake: 0,
};

const hedge3Form = {
  stake: 0,
  odds: 1.88,
  comission: 0,
  profit: 0,
  risk: 0,
  winBalance: 0,
  unmatched: 0,
  cancelledStake: 0,
};

const freeBet = {
  profitRetained: 0,
  hedge1FormfinalBalance: 0,
  hedge2FormfinalBalance: 0,
  hedge3FormfinalBalance: 0,
};

// const trunc = (value) => Math.trunc(value * 100) / 100;
const round = (value: number) => Math.round(value * 100) / 100;

const mainFormComissionRate = 1 - mainForm.comission / 100;
const combinedMainFormComissionRate = 1 - combinedMainForm.comission / 100;
const hedge1FormComissionRate = 1 - hedge1Form.comission / 100;
const hedge2FormComissionRate = 1 - hedge2Form.comission / 100;
const hedge3FormComissionRate = 1 - hedge3Form.comission / 100;

//SUSTITUIR: ((mainForm.odds * mainForm.stake) - mainForm.stake)
//POR: (mainForm.odds - 1) * mainForm.stake

// Funciones de cálculo

function calculate_simple_matched_betting_standard_no_promotion_unmatched(
  matchedStake: number,
  cancelledStake: number,
  newOdds: number
) {
  hedge1Form.cancelledStake = cancelledStake;
  hedge1Form.unmatched = hedge1Form.stake - matchedStake;

  hedge1Form.risk = -((hedge1Form.odds - 1) * (hedge1Form.stake - hedge1Form.cancelledStake));
  hedge1Form.profit = (hedge1Form.stake - hedge1Form.cancelledStake) * hedge1FormComissionRate;

  hedge2Form.comission = hedge1Form.comission;
  hedge2Form.odds = newOdds;

  hedge2Form.stake =
    (mainForm.odds * mainForm.stake -
      hedge1Form.odds * (hedge1Form.stake - hedge1Form.cancelledStake) +
      (hedge1Form.comission / 100) * (hedge1Form.stake - hedge1Form.cancelledStake)) /
    (-1 + hedge2Form.odds + (100 - hedge1Form.comission) / 100);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.profit;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.profit;
}

function calculate_simple_matched_betting_standard_use_freebet_unmatched(
  matchedStake,
  cancelledStake,
  newOdds
) {
  hedge1Form.cancelledStake = cancelledStake;
  hedge1Form.unmatched = hedge1Form.stake - matchedStake;

  hedge1Form.risk = -((hedge1Form.odds - 1) * (hedge1Form.stake - hedge1Form.cancelledStake));
  hedge1Form.profit = (hedge1Form.stake - hedge1Form.cancelledStake) * hedge1FormComissionRate;

  hedge2Form.comission = hedge1Form.comission;
  hedge2Form.odds = newOdds;

  hedge2Form.stake =
    (mainForm.stake * (mainForm.odds - 1) -
      (hedge1Form.odds - 1) * (hedge1Form.stake - hedge1Form.cancelledStake) -
      ((100 - hedge1Form.comission) / 100) * (hedge1Form.stake - hedge1Form.cancelledStake)) /
    (-1 + hedge2Form.odds + (100 - hedge2Form.comission) / 100);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.profit;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.profit;
}

//TEST ESTA FUNCION
function calculate_simple_matched_betting_standard_generate_freebet_unmatched(
  matchedStake,
  cancelledStake,
  newOdds
) {
  freeBet.profitRetained = (combinedMainForm.refundRatio / 100) * combinedMainForm.refundValue;

  hedge1Form.cancelledStake = cancelledStake;
  hedge1Form.unmatched = hedge1Form.stake - matchedStake;

  hedge1Form.risk = -((hedge1Form.odds - 1) * (hedge1Form.stake - hedge1Form.cancelledStake));
  hedge1Form.profit = (hedge1Form.stake - hedge1Form.cancelledStake) * hedge1FormComissionRate;

  hedge2Form.comission = hedge1Form.comission;
  hedge2Form.odds = newOdds;

  hedge2Form.stake =
    (mainForm.odds * mainForm.stake -
      (hedge1Form.odds - 1) * (hedge1Form.stake - hedge1Form.cancelledStake) -
      ((100 - hedge1Form.comission) / 100) * (hedge1Form.stake - hedge1Form.cancelledStake) -
      freeBet.profitRetained) /
    (hedge2Form.odds - 1 + (100 - hedge2Form.comission) / 100);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.profit;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.profit;
}

// --------------------------------------------------------------------------------

function calculate_simple_matched_betting_standard_no_promotion() {
  // Cálculo para apuesta sin promoción
  mainForm.risk = -mainForm.stake;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    (mainForm.odds * mainForm.stake) / (hedge1Form.odds - hedge1Form.comission / 100);

  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_matched_betting_standard_use_freebet() {
  mainForm.risk = 0;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = mainForm.profit / (hedge1Form.odds - hedge1Form.comission / 100);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_matched_betting_standard_generate_freebet() {
  freeBet.profitRetained = (mainForm.refundRatio / 100) * mainForm.refundValue;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;
  mainForm.risk = -mainForm.stake;
  hedge1Form.stake =
    (mainForm.odds * mainForm.stake - (mainForm.refundRatio / 100) * mainForm.refundValue) /
    (hedge1Form.odds - hedge1Form.comission / 100);

  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;

  freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
}

function calculate_simple_matched_betting_standard_prepayment() {
  mainForm.risk = -mainForm.stake;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    (mainForm.odds * mainForm.stake) / (hedge1Form.odds - hedge1Form.comission / 100);

  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);

  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  main2Form.stake =
    (hedge1Form.profit - hedge1Form.risk) /
    (main2Form.odds * (1 - main2Form.comission / 100) - (1 - main2Form.comission / 100) + 1);

  main2Form.risk = -main2Form.stake;

  main2Form.profit =
    (main2Form.odds * main2Form.stake - main2Form.stake) * (1 - main2Form.comission / 100);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
  hedge1Form.winBalance = mainForm.profit + hedge1Form.profit + main2Form.risk;
  main2Form.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
}

function calculate_simple_matched_betting_underlay_no_promotion() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.odds < hedge1Form.odds
      ? ((mainForm.odds - 1) * mainForm.stake) / (hedge1Form.odds - 1)
      : mainForm.stake / hedge1FormComissionRate;
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_matched_betting_underlay_use_freebet() {
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = (mainForm.profit - mainForm.stake) / (hedge1Form.odds - 1);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_matched_betting_underlay_generate_freebet() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.odds < hedge1Form.odds
      ? (mainForm.profit - (mainForm.refundRatio / 100) * mainForm.refundValue) /
        (hedge1Form.odds - 1)
      : (mainForm.profit - (mainForm.refundRatio / 100) * hedge1Form.refundValue) /
        (hedge1Form.odds - 1);

  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;

  freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.retainedProfit;
}

function calculate_simple_matched_betting_underlay_prepayment() {
  mainForm.risk = -mainForm.stake;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.odds < hedge1Form.odds
      ? ((mainForm.odds - 1) * mainForm.stake) / (hedge1Form.odds - 1)
      : mainForm.stake / hedge1FormComissionRate;
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  main2Form.stake =
    (hedge1Form.profit - hedge1Form.risk) /
    (main2Form.odds * (1 - main2Form.comission / 100) - (1 - main2Form.comission / 100) + 1);

  main2Form.risk = -main2Form.stake;

  main2Form.profit =
    (main2Form.odds * main2Form.stake - main2Form.stake) * (1 - main2Form.comission / 100);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
  hedge1Form.winBalance = mainForm.profit + hedge1Form.profit + main2Form.risk;
  main2Form.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
}

function calculate_simple_matched_betting_overlay_no_promotion() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.odds < hedge1Form.odds
      ? mainForm.stake / hedge1FormComissionRate
      : ((mainForm.odds - 1) * mainForm.stake) / (hedge1Form.odds - 1);
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_matched_betting_overlay_use_freebet() {
  mainForm.risk = 0;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    ((mainForm.odds - 1) * mainForm.stake * mainFormComissionRate) / (hedge1Form.odds - 1);

  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_matched_betting_overlay_generate_freebet() {
  freeBet.profitRetained = (mainForm.refundRatio / 100) * mainForm.refundValue;

  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    ((mainForm.odds - 1) * mainForm.stake * mainFormComissionRate) / (hedge1Form.odds - 1);

  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;

  freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
}

function calculate_simple_matched_betting_overlay_prepayment() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.odds < hedge1Form.odds
      ? mainForm.stake / hedge1FormComissionRate
      : ((mainForm.odds - 1) * mainForm.stake) / (hedge1Form.odds - 1);

  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  main2Form.stake =
    (hedge1Form.profit - hedge1Form.risk) /
    (main2Form.odds * (1 - main2Form.comission / 100) - (1 - main2Form.comission / 100) + 1);

  main2Form.risk = -main2Form.stake;

  main2Form.profit =
    (main2Form.odds * main2Form.stake - main2Form.stake) * (1 - main2Form.comission / 100);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
  hedge1Form.winBalance = mainForm.profit + hedge1Form.profit + main2Form.risk;
  main2Form.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
}

function calculate_simple_dutching_2_options_standard_no_promotion() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    (mainForm.odds * mainForm.stake * mainFormComissionRate) /
    (hedge1FormComissionRate * hedge1Form.odds - hedge1FormComissionRate + 1);

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  hedge1Form.risk = -hedge1Form.stake;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_dutching_2_options_standard_use_freebet() {
  mainForm.risk = 0;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.profit / (hedge1Form.odds * hedge1FormComissionRate - hedge1FormComissionRate + 1);

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_dutching_2_options_standard_generate_freebet() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  freeBet.profitRetained =
    (mainForm.refundRatio / 100) * mainForm.refundValue * mainFormComissionRate;

  hedge1Form.stake =
    (mainForm.odds * mainForm.stake * mainFormComissionRate -
      (mainForm.refundRatio / 100) * mainForm.refundValue * mainFormComissionRate) /
    (hedge1Form.odds * hedge1FormComissionRate - hedge1FormComissionRate + 1);

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  hedge1Form.risk = -hedge1Form.stake;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;

  freeBet.profitRetained = (mainForm.refundRatio / 100) * mainForm.refundValue;
  freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
}

function calculate_simple_dutching_2_options_standard_prepayment() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    (mainForm.odds * mainForm.stake * mainFormComissionRate) /
    (hedge1FormComissionRate * hedge1Form.odds - hedge1FormComissionRate + 1);

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  hedge1Form.risk = -hedge1Form.stake;

  main2Form.stake =
    (hedge1Form.profit - hedge1Form.risk) /
    (main2Form.odds * (1 - main2Form.comission / 100) - (1 - main2Form.comission / 100) + 1);

  main2Form.risk = -main2Form.stake;

  main2Form.profit =
    (main2Form.odds * main2Form.stake - main2Form.stake) * (1 - main2Form.comission / 100);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
  hedge1Form.winBalance = mainForm.profit + hedge1Form.profit + main2Form.risk;
  main2Form.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
}

function calculate_simple_dutching_2_options_underlay_no_promotion() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = mainForm.profit;

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  hedge1Form.risk = -hedge1Form.stake;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_dutching_2_options_underlay_use_freebet() {
  mainForm.risk = 0;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = mainForm.stake * (mainForm.odds - 2);

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_dutching_2_options_underlay_prepayment() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = mainForm.profit;

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  hedge1Form.risk = -hedge1Form.stake;

  main2Form.stake =
    (hedge1Form.profit - hedge1Form.risk) /
    (main2Form.odds * (1 - main2Form.comission / 100) - (1 - main2Form.comission / 100) + 1);

  main2Form.risk = -main2Form.stake;

  main2Form.profit =
    (main2Form.odds * main2Form.stake - main2Form.stake) * (1 - main2Form.comission / 100);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
  hedge1Form.winBalance = mainForm.profit + hedge1Form.profit + main2Form.risk;
  main2Form.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
}

function calculate_simple_dutching_2_options_overlay_use_freebet() {
  mainForm.risk = 0;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.stake / ((hedge1Form.odds - 1) * ((100 - hedge1Form.comission) / 100));

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_dutching_2_options_overlay_no_promotion() {
  mainForm.risk = -mainForm.stake;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = mainForm.stake / ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk;
  hedge1Form.winBalance = hedge1Form.profit + mainForm.risk;
}

function calculate_simple_dutching_2_options_overlay_prepayment() {
  mainForm.risk = 0;
  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    mainForm.stake / ((hedge1Form.odds - 1) * ((100 - hedge1Form.comission) / 100));

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  main2Form.stake =
    (hedge1Form.profit - hedge1Form.risk) /
    (main2Form.odds * (1 - main2Form.comission / 100) - (1 - main2Form.comission / 100) + 1);

  main2Form.risk = -main2Form.stake;

  main2Form.profit =
    (main2Form.odds * main2Form.stake - main2Form.stake) * (1 - main2Form.comission / 100);

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
  hedge1Form.winBalance = mainForm.profit + hedge1Form.profit + main2Form.risk;
  main2Form.winBalance = mainForm.profit + hedge1Form.risk + main2Form.profit;
}

function calculate_simple_dutching_3_options_standard_no_promotion() {
  mainForm.risk = -mainForm.stake;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake = (mainForm.odds * mainForm.stake * mainFormComissionRate) / hedge1Form.odds;

  hedge1Form.risk = -hedge1Form.stake;

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  hedge2Form.stake = (mainForm.odds * mainForm.stake * mainFormComissionRate) / hedge2Form.odds;

  hedge2Form.risk = -hedge2Form.stake;

  hedge2Form.profit =
    (hedge2Form.odds * hedge2Form.stake - hedge2Form.stake) * hedge2FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.risk;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.risk + hedge2Form.profit;
}

function calculate_simple_dutching_3_options_standard_use_freebet() {
  mainForm.risk = 0;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    ((mainForm.odds - 1) * mainForm.stake) /
    mainFormComissionRate /
    hedge1FormComissionRate /
    hedge1Form.odds;

  hedge1Form.risk = -hedge1Form.stake;

  hedge1Form.profit = (hedge1Form.odds - 1) * hedge1Form.stake * hedge1FormComissionRate;

  hedge2Form.stake =
    ((mainForm.odds - 1) * mainForm.stake) /
    mainFormComissionRate /
    hedge2FormComissionRate /
    hedge2Form.odds;

  hedge2Form.risk = -hedge2Form.stake;

  hedge2Form.profit = (hedge2Form.odds - 1) * hedge2Form.stake * hedge2FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.risk;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.risk + hedge2Form.profit;
}

function calculate_simple_dutching_3_options_standard_generate_freebet() {
  freeBet.profitRetained =
    (mainForm.refundRatio / 100) * mainForm.refundValue * mainFormComissionRate;

  mainForm.risk = -mainForm.stake;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge1Form.stake =
    (mainForm.odds * mainForm.stake * mainFormComissionRate - freeBet.profitRetained) /
    (((100 - hedge1Form.comission) / 100) * hedge1Form.odds -
      (100 - hedge1Form.comission) / 100 +
      1);

  hedge1Form.risk = -hedge1Form.stake;

  hedge1Form.profit = (hedge1Form.odds - 1) * hedge1Form.stake * hedge1FormComissionRate;

  hedge2Form.stake =
    (mainForm.odds * mainForm.stake * mainFormComissionRate - freeBet.profitRetained) /
    (((100 - hedge2Form.comission) / 100) * hedge2Form.odds -
      (100 - hedge2Form.comission) / 100 +
      1);

  hedge2Form.risk = -hedge2Form.stake;

  hedge2Form.profit = (hedge2Form.odds - 1) * hedge2Form.stake * hedge2FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.risk;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.risk + hedge2Form.profit;

  freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
  freeBet.hedge2FormfinalBalance = hedge2Form.winBalance + freeBet.profitRetained;
}

function calculate_simple_dutching_3_options_underlay_no_promotion() {
  mainForm.risk = -mainForm.stake;

  mainForm.profit = (mainForm.odds - 1) * mainForm.stake * mainFormComissionRate;

  hedge2Form.stake =
    (mainForm.stake * (mainForm.odds - 1)) /
    (1 +
      ((hedge2Form.odds - 1) * ((100 - hedge2Form.comission) / 100) + 1) /
        ((hedge1Form.odds - 1) * ((100 - hedge1Form.comission) / 100) + 1));

  hedge2Form.risk = -hedge2Form.stake;

  hedge2Form.profit =
    (hedge2Form.odds * hedge2Form.stake - hedge2Form.stake) * hedge2FormComissionRate;

  hedge1Form.stake =
    (hedge2Form.stake * ((hedge2Form.odds - 1) * ((100 - hedge2Form.comission) / 100) + 1)) /
    ((hedge1Form.odds - 1) * ((100 - hedge1Form.comission) / 100) + 1);

  hedge1Form.risk = -hedge1Form.stake;

  hedge1Form.profit =
    (hedge1Form.odds * hedge1Form.stake - hedge1Form.stake) * hedge1FormComissionRate;

  mainForm.winBalance = mainForm.profit + hedge1Form.risk + hedge2Form.risk;
  hedge1Form.winBalance = mainForm.risk + hedge1Form.profit + hedge2Form.risk;
  hedge2Form.winBalance = mainForm.risk + hedge1Form.risk + hedge2Form.profit;
}

function calculate_combined_2_lines_dutching_standard_no_promotion(line1Status, line2Status) {
  line1.status = line1Status;
  line2.status = line2Status;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge1Form.stake =
    (combinedMainForm.stake * (combinedMainForm.odds * combinedMainFormComissionRate)) /
    (hedge1Form.odds * hedge1FormComissionRate +
      (hedge1Form.odds * hedge1FormComissionRate) /
        (hedge2Form.odds * hedge2FormComissionRate - 1));
  hedge1Form.risk = -hedge1Form.stake;
  hedge1Form.profit = hedge1Form.stake * ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  hedge2Form.stake =
    (hedge1Form.stake * (hedge1Form.odds * hedge1FormComissionRate)) /
    (hedge2Form.odds * hedge2FormComissionRate - 1);

  hedge2Form.risk = -hedge2Form.stake;
  hedge2Form.profit = hedge2Form.stake * ((hedge2Form.odds - 1) * hedge2FormComissionRate);

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      combinedMainForm.winBalance = combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
    }
  }
}

function calculate_combined_2_lines_dutching_standard_use_freebet(line1Status, line2Status) {
  line1.status = line1Status;
  line2.status = line2Status;

  combinedMainForm.risk = 0;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge2Form.stake =
    ((combinedMainForm.odds * combinedMainFormComissionRate - 1) * combinedMainForm.stake) /
    (hedge2Form.odds * hedge2FormComissionRate);

  hedge2Form.risk = -hedge2Form.stake;
  hedge2Form.profit = hedge2Form.stake * ((hedge2Form.odds - 1) * hedge2FormComissionRate);

  hedge1Form.stake =
    ((combinedMainForm.odds * combinedMainFormComissionRate - 1) * combinedMainForm.stake -
      hedge2Form.stake) /
    (hedge1Form.odds * hedge1FormComissionRate);
  hedge1Form.risk = -hedge1Form.stake;
  hedge1Form.profit = hedge1Form.stake * ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      combinedMainForm.winBalance = combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
    }
  }
}

function calculate_combined_2_lines_dutching_standard_generate_freebet(line1Status, line2Status) {
  line1.status = line1Status;
  line2.status = line2Status;

  freeBet.profitRetained = (combinedMainForm.refundRatio / 100) * combinedMainForm.refundValue;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge2Form.stake =
    (combinedMainForm.odds * combinedMainFormComissionRate * combinedMainForm.stake -
      freeBet.profitRetained) /
    (hedge2Form.odds * hedge2FormComissionRate);

  hedge2Form.risk = -hedge2Form.stake;
  hedge2Form.profit = hedge2Form.stake * ((hedge2Form.odds - 1) * hedge2FormComissionRate);

  hedge1Form.stake =
    (combinedMainForm.odds * combinedMainFormComissionRate * combinedMainForm.stake -
      freeBet.profitRetained -
      hedge2Form.stake) /
    (hedge1Form.odds * hedge1FormComissionRate);
  hedge1Form.risk = -hedge1Form.stake;
  hedge1Form.profit = hedge1Form.stake * ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
    freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
      freeBet.hedge2FormfinalBalance = hedge2Form.winBalance + freeBet.profitRetained;
    } else if (line2Status === 'won') {
      combinedMainForm.winBalance = combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
    }
  }
}

function calculate_combined_2_lines_matched_betting_standard_no_promotion(
  line1Status,
  line2Status
) {
  line1.status = line1Status;
  line2.status = line2Status;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge2Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds) /
    (hedge2FormComissionRate + hedge2Form.odds - 1);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  hedge1Form.stake =
    hedge2FormComissionRate * (hedge2Form.stake / (hedge1FormComissionRate + hedge1Form.odds - 1));
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      combinedMainForm.winBalance = combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
    }
  }
}

function calculate_combined_2_lines_matched_betting_standard_use_freebet(line1Status, line2Status) {
  line1.status = line1Status;
  line2.status = line2Status;

  combinedMainForm.risk = 0;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge2Form.stake =
    ((combinedMainForm.odds - 1) * combinedMainForm.stake) /
    (hedge2FormComissionRate + hedge2Form.odds - 1);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  hedge1Form.stake =
    ((combinedMainForm.odds - 1) * combinedMainForm.stake -
      (hedge2Form.odds - 1) * hedge2Form.stake) /
    (hedge1FormComissionRate + hedge1Form.odds - 1);
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      combinedMainForm.winBalance = combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
    }
  }
}

function calculate_combined_2_lines_matched_betting_standard_generate_freebet(
  line1Status,
  line2Status
) {
  line1.status = line1Status;
  line2.status = line2Status;

  freeBet.profitRetained = (combinedMainForm.refundRatio / 100) * combinedMainForm.refundValue;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge2Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds - freeBet.profitRetained) /
    (hedge2FormComissionRate + hedge2Form.odds - 1);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  hedge1Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds -
      (hedge2Form.odds - 1) * hedge2Form.stake -
      freeBet.profitRetained) /
    (hedge1FormComissionRate + hedge1Form.odds - 1);
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
    freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
      freeBet.hedge2FormfinalBalance = hedge2Form.winBalance + freeBet.profitRetained;
    } else if (line2Status === 'won') {
      combinedMainForm.winBalance = combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk;
    }
  }
}

function calculate_combined_3_lines_matched_betting_standard_no_promotion(
  line1Status,
  line2Status,
  line3Status
) {
  line1.status = line1Status;
  line2.status = line2Status;
  line3.status = line3Status;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge3Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds) /
    (hedge3FormComissionRate + hedge3Form.odds - 1);

  hedge3Form.risk = -((hedge3Form.odds - 1) * hedge3Form.stake);
  hedge3Form.profit = hedge3Form.stake * hedge3FormComissionRate;

  hedge2Form.stake =
    (combinedMainForm.odds * combinedMainForm.stake - (hedge3Form.odds - 1) * hedge3Form.stake) /
    (hedge2FormComissionRate + hedge2Form.odds - 1);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  hedge1Form.stake =
    (combinedMainForm.odds * combinedMainForm.stake -
      (hedge3Form.odds - 1) * hedge3Form.stake -
      (hedge2Form.odds - 1) * hedge2Form.stake) /
    (hedge1FormComissionRate + hedge1Form.odds - 1);
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      if (line3Status === 'lost') {
        hedge3Form.winBalance =
          combinedMainForm.risk + hedge1Form.risk + hedge2Form.risk + hedge3Form.profit;
      } else if (line3Status === 'won') {
        combinedMainForm.winBalance =
          combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk + hedge3Form.risk;
      }
    }
  }
}

function calculate_combined_3_lines_matched_betting_standard_use_freebet(
  line1Status,
  line2Status,
  line3Status
) {
  line1.status = line1Status;
  line2.status = line2Status;
  line3.status = line3Status;

  combinedMainForm.risk = 0;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge3Form.stake =
    ((combinedMainForm.odds - 1) * combinedMainForm.stake) /
    (hedge3FormComissionRate + hedge3Form.odds - 1);

  hedge3Form.risk = -((hedge3Form.odds - 1) * hedge3Form.stake);
  hedge3Form.profit = hedge3Form.stake * hedge3FormComissionRate;

  hedge2Form.stake =
    ((combinedMainForm.odds - 1) * combinedMainForm.stake -
      (hedge3Form.odds - 1) * hedge3Form.stake) /
    (hedge2FormComissionRate + hedge2Form.odds - 1);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  hedge1Form.stake =
    ((combinedMainForm.odds - 1) * combinedMainForm.stake -
      (hedge3Form.odds - 1) * hedge3Form.stake -
      (hedge2Form.odds - 1) * hedge2Form.stake) /
    (hedge1FormComissionRate + hedge1Form.odds - 1);
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      if (line3Status === 'lost') {
        hedge3Form.winBalance =
          combinedMainForm.risk + hedge1Form.risk + hedge2Form.risk + hedge3Form.profit;
      } else if (line3Status === 'won') {
        combinedMainForm.winBalance =
          combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk + hedge3Form.risk;
      }
    }
  }
}

function calculate_combined_3_lines_matched_betting_standard_generate_freebet(
  line1Status,
  line2Status,
  line3Status
) {
  line1.status = line1Status;
  line2.status = line2Status;
  line3.status = line3Status;

  freeBet.profitRetained = (combinedMainForm.refundRatio / 100) * combinedMainForm.refundValue;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge3Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds - freeBet.profitRetained) /
    (hedge3FormComissionRate + hedge3Form.odds - 1);

  hedge3Form.risk = -((hedge3Form.odds - 1) * hedge3Form.stake);
  hedge3Form.profit = hedge3Form.stake * hedge3FormComissionRate;

  hedge2Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds -
      (hedge3Form.odds - 1) * hedge3Form.stake -
      freeBet.profitRetained) /
    (hedge2FormComissionRate + hedge2Form.odds - 1);

  hedge2Form.risk = -((hedge2Form.odds - 1) * hedge2Form.stake);
  hedge2Form.profit = hedge2Form.stake * hedge2FormComissionRate;

  hedge1Form.stake =
    (combinedMainForm.stake * combinedMainForm.odds -
      (hedge2Form.odds - 1) * hedge2Form.stake -
      (hedge3Form.odds - 1) * hedge3Form.stake -
      freeBet.profitRetained) /
    (hedge1FormComissionRate + hedge1Form.odds - 1);
  hedge1Form.risk = -((hedge1Form.odds - 1) * hedge1Form.stake);
  hedge1Form.profit = hedge1Form.stake * hedge1FormComissionRate;

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
    freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
      freeBet.hedge2FormfinalBalance = hedge2Form.winBalance + freeBet.profitRetained;
    } else if (line2Status === 'won') {
      if (line3Status === 'lost') {
        hedge3Form.winBalance =
          combinedMainForm.risk + hedge1Form.risk + hedge2Form.risk + hedge3Form.profit;
        freeBet.hedge3FormfinalBalance = hedge3Form.winBalance + freeBet.profitRetained;
      } else if (line3Status === 'won') {
        combinedMainForm.winBalance =
          combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk + hedge3Form.risk;
      }
    }
  }
}

function calculate_combined_3_lines_dutching_standard_no_promotion(
  line1Status,
  line2Status,
  line3Status
) {
  line1.status = line1Status;
  line2.status = line2Status;
  line3.status = line3Status;

  combinedMainForm.risk = -combinedMainForm.stake;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge1Form.stake =
    (combinedMainForm.stake *
      (combinedMainForm.odds * combinedMainFormComissionRate -
        (combinedMainForm.odds * combinedMainFormComissionRate) /
          (hedge3Form.odds * hedge3FormComissionRate))) /
    (hedge1Form.odds * hedge1FormComissionRate +
      (hedge1Form.odds * hedge1FormComissionRate) /
        (hedge2Form.odds * hedge2FormComissionRate - 1));
  hedge1Form.risk = -hedge1Form.stake;
  hedge1Form.profit = hedge1Form.stake * ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  hedge2Form.stake =
    (hedge1Form.stake * (hedge1Form.odds * hedge1FormComissionRate)) /
    (hedge2Form.odds * hedge2FormComissionRate - 1);

  hedge2Form.risk = -hedge2Form.stake;
  hedge2Form.profit = hedge2Form.stake * ((hedge2Form.odds - 1) * hedge2FormComissionRate);

  hedge3Form.stake =
    (combinedMainForm.stake * (combinedMainForm.odds * combinedMainFormComissionRate)) /
    (hedge3Form.odds * hedge3FormComissionRate);

  hedge3Form.risk = -hedge3Form.stake;
  hedge3Form.profit = hedge3Form.stake * ((hedge3Form.odds - 1) * hedge3FormComissionRate);

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      if (line3Status === 'lost') {
        hedge3Form.winBalance =
          combinedMainForm.risk + hedge1Form.risk + hedge2Form.risk + hedge3Form.profit;
      } else if (line3Status === 'won') {
        combinedMainForm.winBalance =
          combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk + hedge3Form.risk;
      }
    }
  }
}

function calculate_combined_3_lines_dutching_standard_use_freebet(
  line1Status,
  line2Status,
  line3Status
) {
  line1.status = line1Status;
  line2.status = line2Status;
  line3.status = line3Status;

  combinedMainForm.risk = 0;
  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge3Form.stake =
    ((combinedMainForm.odds * combinedMainFormComissionRate - 1) * combinedMainForm.stake) /
    (hedge3Form.odds * hedge3FormComissionRate);

  hedge3Form.risk = -hedge3Form.stake;
  hedge3Form.profit = hedge3Form.stake * ((hedge3Form.odds - 1) * hedge3FormComissionRate);

  hedge2Form.stake =
    ((combinedMainForm.odds * combinedMainFormComissionRate - 1) * combinedMainForm.stake -
      hedge3Form.stake) /
    (hedge2Form.odds * hedge2FormComissionRate);

  hedge2Form.risk = -hedge2Form.stake;
  hedge2Form.profit = hedge2Form.stake * ((hedge2Form.odds - 1) * hedge2FormComissionRate);

  hedge1Form.stake =
    ((combinedMainForm.odds * combinedMainFormComissionRate - 1) * combinedMainForm.stake -
      hedge3Form.stake -
      hedge2Form.stake) /
    (hedge1Form.odds * hedge1FormComissionRate);
  hedge1Form.risk = -hedge1Form.stake;
  hedge1Form.profit = hedge1Form.stake * ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
    } else if (line2Status === 'won') {
      if (line3Status === 'lost') {
        hedge3Form.winBalance =
          combinedMainForm.risk + hedge1Form.risk + hedge2Form.risk + hedge3Form.profit;
      } else if (line3Status === 'won') {
        combinedMainForm.winBalance =
          combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk + hedge3Form.risk;
      }
    }
  }
}

function calculate_combined_3_lines_dutching_standard_generate_freebet(
  line1Status,
  line2Status,
  line3Status
) {
  line1.status = line1Status;
  line2.status = line2Status;
  line3.status = line3Status;

  freeBet.profitRetained = (combinedMainForm.refundRatio / 100) * combinedMainForm.refundValue;

  combinedMainForm.risk = -combinedMainForm.stake;

  combinedMainForm.profit =
    combinedMainForm.stake * ((combinedMainForm.odds - 1) * combinedMainFormComissionRate);

  hedge3Form.stake =
    (combinedMainForm.odds * combinedMainFormComissionRate * combinedMainForm.stake -
      freeBet.profitRetained) /
    (hedge3Form.odds * hedge3FormComissionRate);

  hedge3Form.risk = -hedge3Form.stake;
  hedge3Form.profit = hedge3Form.stake * ((hedge3Form.odds - 1) * hedge3FormComissionRate);

  hedge2Form.stake =
    (combinedMainForm.odds * combinedMainFormComissionRate * combinedMainForm.stake -
      freeBet.profitRetained -
      hedge3Form.stake) /
    (hedge2Form.odds * hedge2FormComissionRate);

  hedge2Form.risk = -hedge2Form.stake;
  hedge2Form.profit = hedge2Form.stake * ((hedge2Form.odds - 1) * hedge2FormComissionRate);

  hedge1Form.stake =
    (combinedMainForm.odds * combinedMainFormComissionRate * combinedMainForm.stake -
      freeBet.profitRetained -
      hedge3Form.stake -
      hedge2Form.stake) /
    (hedge1Form.odds * hedge1FormComissionRate);

  hedge1Form.risk = -hedge1Form.stake;
  hedge1Form.profit = hedge1Form.stake * ((hedge1Form.odds - 1) * hedge1FormComissionRate);

  if (line1Status === 'lost') {
    hedge1Form.winBalance = combinedMainForm.risk + hedge1Form.profit;
    freeBet.hedge1FormfinalBalance = hedge1Form.winBalance + freeBet.profitRetained;
  } else if (line1Status === 'won') {
    if (line2Status === 'lost') {
      hedge2Form.winBalance = combinedMainForm.risk + hedge1Form.risk + hedge2Form.profit;
      freeBet.hedge2FormfinalBalance = hedge2Form.winBalance + freeBet.profitRetained;
    } else if (line2Status === 'won') {
      if (line3Status === 'lost') {
        hedge3Form.winBalance =
          combinedMainForm.risk + hedge1Form.risk + hedge2Form.risk + hedge3Form.profit;
        freeBet.hedge3FormfinalBalance = hedge3Form.winBalance + freeBet.profitRetained;
      } else if (line3Status === 'won') {
        combinedMainForm.winBalance =
          combinedMainForm.profit + hedge1Form.risk + hedge2Form.risk + hedge3Form.risk;
      }
    }
  }
}

// calculate_simple_matched_betting_standard_no_promotion();
// calculate_simple_matched_betting_standard_no_promotion_unmatched(137.73, 0, 1.73);

// console.log('');
// console.log('calculate_simple_matched_betting_standard_no_promotion:');
// console.log('calculate_simple_matched_betting_unmatched:');
// console.log('');
// console.log('mainForm:\n');
// console.log('stake: ', round(mainForm.stake));
// console.log('odds: ', round(mainForm.odds));
// console.log('comission: ', round(mainForm.comission));
// console.log('refundValue: ', round(mainForm.refundValue));
// console.log('refundRatio: ', round(mainForm.refundRatio));
// console.log('profit: ', round(mainForm.profit));
// console.log('risk: ', round(mainForm.risk));
// console.log('winBalance: ', round(mainForm.winBalance));
// console.log('');
// console.log('hedge1Form:\n');
// console.log('stake: ', round(hedge1Form.stake));
// console.log('unmatched: ', round(hedge1Form.unmatched));
// console.log('cancelledStake: ', round(hedge1Form.cancelledStake));
// console.log('odds: ', round(hedge1Form.odds));
// console.log('comission: ', round(hedge1Form.comission));
// console.log('profit: ', round(hedge1Form.profit));
// console.log('risk: ', round(hedge1Form.risk));
// console.log('winBalance: ', round(hedge1Form.winBalance));
// console.log('');
// console.log('hedge2Form:\n');
// console.log('stake: ', round(hedge2Form.stake));
// console.log('unmatched: ', round(hedge2Form.unmatched));
// console.log('cancelledStake: ', round(hedge2Form.cancelledStake));
// console.log('odds: ', round(hedge2Form.odds));
// console.log('comission: ', round(hedge2Form.comission));
// console.log('profit: ', round(hedge2Form.profit));
// console.log('risk: ', round(hedge2Form.risk));
// console.log('winBalance: ', round(hedge2Form.winBalance));
// console.log('');

// console.log("hedge3Form:\n");
// console.log("stake: ", round(hedge3Form.stake));
// console.log("odds: ", round(hedge3Form.odds));
// console.log("comission: ", round(hedge3Form.comission));
// console.log("profit: ", round(hedge3Form.profit));
// console.log("risk: ", round(hedge3Form.risk));
// console.log("winBalance: ", round(hedge3Form.winBalance));
// console.log("");
// console.log('freeBet:\n');
// console.log('profitRetained: ', round(freeBet.profitRetained));
// console.log('hedge1FormfinalBalance: ', round(freeBet.hedge1FormfinalBalance));
// console.log("hedge2FormfinalBalance: ", round(freeBet.hedge2FormfinalBalance));
// console.log("hedge3FormfinalBalance: ", round(freeBet.hedge3FormfinalBalance));
// console.log("");
