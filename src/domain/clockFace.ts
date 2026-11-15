export function clockLabel(total: number): string {
  const time = ((total % 720) + 720) % 720;
  return (Math.floor(time / 60) || 12) + '時' + (time % 60) + '分';
}

export function clockAngles(total: number) {
  const time = ((total % 720) + 720) % 720;
  return { minute: (time % 60) * 6, hour: time / 2 };
}
