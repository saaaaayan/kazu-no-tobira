export function addNumberOrderQuestions(stageId, add) {
  const advanced = stageId === 'e1.n05';
  for (let start = 1; start <= 9; start++) for (let end = start + 1; end <= 10; end++) {
    const span = end - start;
    const key = start + '-' + end;
    if (span >= 2) {
      const from = advanced ? end : start;
      const answer = advanced ? start : end;
      const verb = advanced ? 'もどる' : 'すすむ';
      const sign = advanced ? '−' : '＋';
      add('position', 'position-' + key,
        from + 'から ' + span + 'つ ' + verb + 'と、どの かずに つきますか？', answer,
        ['はじめに いる かずを みつけよう。', '1つ うごくたびに、となりの かずに つくよ。',
          from + 'から、' + (advanced ? 'ちいさく なる' : 'おおきく なる') + ' ほうへ ' + span + 'つ うごこう。'],
        [from + 'から うごいた あとの かずを もとめるよ。', 'うごいた かいすうだけ となりへ いくよ。',
          from + sign + span + '＝' + answer + '。', 'ぎゃくに うごかすと ' + answer + (advanced ? '＋' : '−') + span + '＝' + from + '。',
          'はじめの かずを 1かいめに かぞえないよ。'],
        [advanced ? answer + 1 : answer - 1, 'はじめの かずから かぞえたかも。となりへ うごいて 1かいだよ。'], undefined, 1);

      const count = advanced ? span + 1 : span - 1;
      add('interval', 'interval-' + key,
        start + 'と ' + end + 'の あいだに カードを じゅんに ならべます。' +
          (advanced ? 'りょうはしも いれると' : 'りょうはしを のぞくと') + '、なんまい ですか？', count,
        ['りょうはしの カードを かぞえるか、たしかめよう。', advanced
          ? 'はじめの カードも 1まいに かぞえるよ。' : 'はじめと おわりの カードは どちらも はずすよ。',
        start + 'から ' + end + 'まで、かずを ひとつずつ ならべて かぞえよう。'],
        ['カードが なんまい あるかを もとめるよ。', 'かずが 1ふえるたびに あたらしい カードが 1まい あるよ。',
          Array.from({ length: count }, (_, i) => start + i + (advanced ? 0 : 1)).join('、') + 'の ' + count + 'まいだよ。',
          end + '−' + start + '＝' + span + '。うごく かいすうと カードの まいすうの ちがいを たしかめよう。',
          'はしを いれるか どうかで、こたえが かわるよ。'],
        [span, 'それは となりへ うごく かいすうだよ。カードの まいすうを かぞえよう。'], undefined, 2);
    }

    if (span >= 2 && span % 2 === 0) {
      const middle = start + span / 2;
      add('sequence', 'middle-' + key,
        start + 'から ' + end + 'までの カードを じゅんに ならべます。' +
          (advanced ? 'まんなかの ひとつ まえ' : 'まんなか') + 'は どの かずですか？',
        advanced ? middle - 1 : middle,
        ['りょうはしから 1まいずつ くみに して みよう。', 'りょうはしを おなじ まいすうだけ のぞくと、まんなかが わかるよ。',
          start + 'から ' + end + 'まで ならべて、りょうはしから 1まいずつ のぞこう。'],
        ['まんなか' + (advanced ? 'の ひとつ まえ' : '') + 'の カードを みつけるよ。',
          'まんなかの りょうがわに、おなじ まいすうの カードが ならぶよ。',
          'りょうはしから くみに すると、まんなかは ' + middle + '。' +
            (advanced ? middle + 'の ひとつ まえは ' + (middle - 1) + '。' : ''),
          middle + '−' + start + '＝' + span / 2 + '。' + end + '−' + middle + '＝' + span / 2 + '。りょうがわが おなじだね。',
          advanced ? 'まんなかを みつけてから、ひとつ まえに もどるよ。' : 'かずを とばさずに ならべよう。'],
        advanced ? [middle, 'それは まんなかの カードだね。そこから ひとつ まえへ。'] : undefined, undefined, 3);
    }

    if (span >= 3) {
      const stop = advanced ? end - 2 : end;
      const move = stop - start;
      add('line', 'queue-' + key,
        'れつの まえから ' + start + 'ばんめに います。うしろへ うごいて ' + end +
          'ばんめに つきました。' + (advanced ? 'そこから まえへ 2つ もどります。はじめの ばしょより いくつ うしろですか？'
            : 'はじめの ばしょより いくつ うしろですか？'), move,
        ['れつの ばんごうと、うごいた かいすうを わけて かんがえよう。',
          'うしろへ いくと ばんごうが ふえて、まえへ いくと ばんごうが へるよ。',
          (advanced ? end + 'ばんめから 2つ まえへ もどってから、' : end + 'ばんめと ') +
            start + 'ばんめとの ちがいを しらべよう。'],
        ['はじめの ばしょから いくつ うしろに きたかを もとめるよ。',
          'となりに うごくたびに ばんごうが 1ずつ かわるよ。',
          (advanced ? end + '−2＝' + stop + '。' : '') + stop + '−' + start + '＝' + move + '。',
          start + '＋' + move + '＝' + stop + '。はじめから うしろへ うごいて たしかめられるよ。',
          'さいごの ばんごうが そのまま うごいた かいすうに なる わけではないよ。'],
        [stop, 'それは さいごの ばんごうかも。はじめの ばんごうとの ちがいを もとめよう。'], undefined, 3);
    }
  }
}
