const { Timer } = easytimer;

const timer = new Timer({
  startValues: { minutes: 2 },
});

console.log(timer.getTimeValues().toString(["minutes", "seconds"]));
