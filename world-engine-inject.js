// world-engine-inject.js — 构建注入上下文（条件筛选，只注入影响RP的关键信息）
// [越南语] 注入正文的内容全部输出越南语；内部 state 仍存中文枚举，此处经 L() 映射为越南语，
//         判词表(key 为中文枚举)只翻译取值文本，key 不动以保持与 state 匹配。
window.WORLD_ENGINE_INJECT = (function() {
  const core = window.WORLD_ENGINE_CORE;
  const ledger = window.WORLD_ENGINE_LEDGER;

  // 枚举中文值 → 越南语显示（与 UI 的 weLabel 一致）。用于注入时把 state 里的中文枚举转成越南语。
  const L_MAP = {
    // 事件阶段
    '萌芽': 'Manh nha', '发酵': 'Lên men', '逼近': 'Cận kề', '已爆发': 'Bùng phát', '已消散': 'Tan biến',
    '筹备': 'Chuẩn bị', '执行': 'Thực thi', '关键': 'Then chốt', '已完成': 'Hoàn tất', '已失败': 'Thất bại',
    // 事件本轮动向
    '成功': 'Thành công', '保持': 'Giữ nguyên', '受挫': 'Bị cản',
    // 势力运势
    '鼎盛': 'Cực thịnh', '稳固': 'Vững vàng', '倾轧': 'Khuynh loát', '困顿': 'Khốn đốn', '衰落': 'Suy tàn', '瓦解': 'Tan rã',
    // 势力关系
    '血盟': 'Huyết minh', '盟友': 'Đồng minh', '友好': 'Thân thiện', '中立': 'Trung lập', '冷淡': 'Lạnh nhạt', '敌对': 'Đối địch', '世仇': 'Tử thù',
    // 经济气候
    '繁荣': 'Phồn vinh', '平稳': 'Ổn định', '衰退': 'Suy thoái', '动荡': 'Động loạn',
    // 声誉档位
    '天怒人怨': 'Trời giận người oán', '声名狼藉': 'Tiếng xấu lan xa', '默默无闻': 'Vô danh tiểu tốt', '受人尊敬': 'Được kính trọng', '万众敬仰': 'Muôn người kính ngưỡng',
    // 风声类型
    '公告': 'Cáo thị', '消息': 'Tin tức', '流言': 'Lời đồn', '舆情': 'Dư luận',
    // 仇敌状态
    '追踪中': 'Đang truy lùng', '策划中': 'Đang mưu tính', '执行中': 'Đang ra tay', '已终结': 'Đã chấm dứt',
    // 秘密资产状态
    '有效': 'Còn hiệu lực', '过期': 'Hết hạn', '暴露': 'Bại lộ', '失效': 'Mất hiệu lực',
  };
  function L(v) { return (v != null && L_MAP[v] !== undefined) ? L_MAP[v] : v; }

  // 声誉判词：把等级翻译成给正文模型看的人话，避免注入光秃秃的等级标签
  const REP_DIM_NAME = { authority: 'chốn triều đình', common: 'nơi thị tỉnh', shadow: 'chốn giang hồ', circuit: 'trong giới đồng đạo' };
  const REP_VERDICT = {
    authority: { // 朝堂 —— 守法/顺从 ↔ 挑衅/危险
      天怒人怨: 'triều đình coi như cái gai trong mắt, đã bị truy nã hỏi tội, trên quan trường ai cũng muốn trừ',
      声名狼藉: 'tiếng tăm cực xấu trên quan trường, bị coi là kẻ phiền phức và nguy hiểm, đâu đâu cũng đề phòng',
      默默无闻: 'triều đình không ai biết tên, chẳng lọt vào mắt kẻ đương quyền',
      受人尊敬: 'khá có uy tín trên quan trường, được xem là người đáng dùng đáng tin',
      万众敬仰: 'được kẻ đương quyền hết mực tin cậy, một lời nơi triều đình nặng tựa chín đỉnh',
    },
    common: { // 市井 —— 仁善/保护 ↔ 暴戾/威胁
      天怒人怨: 'dân chúng căm tận xương, nhắc tới là chửi rủa, tránh như rắn rết',
      声名狼藉: 'tiếng tăm nơi thị tỉnh cực tệ, bị coi là mối họa, hàng xóm thấy là tránh đường',
      默默无闻: 'ngoài phố chẳng mấy ai nghe tới, lẫn vào đám đông',
      受人尊敬: 'dân chúng nhớ ơn, tiếng tốt vang xa, xem là người trọng nghĩa',
      万众敬仰: 'muôn dân mến mộ, đi tới đâu dân đứng chật đường, tôn như cha mẹ tái sinh',
    },
    shadow: { // 草莽 —— 有种/敢扛 ↔ 没种/欺弱
      天怒人怨: 'giang hồ ai cũng muốn trừ, ở chợ đen chỉ cần nhắc tên là có kẻ muốn ra tay',
      声名狼藉: 'giới giang hồ khinh thường, coi là kẻ hèn bắt nạt yếu sợ mạnh, không ai muốn cộng tác',
      默默无闻: 'trên giang hồ không ai nhận ra, chốn giang hồ chẳng có tên này',
      受人尊敬: 'trên giang hồ cũng có chút danh, người trong giới nể vài phần khí phách',
      万众敬仰: 'giới giang hồ tôn làm hào kiệt, một lời có thể điều động cả một phương nhân mã',
    },
    circuit: { // 同道 —— 技艺/守规/贡献 ↔ 砸招牌/背叛
      天怒人怨: 'đồng nghiệp coi là cặn bã trong nghề, bị đuổi khỏi giới, ai cũng muốn trừ',
      声名狼藉: 'đồng đạo khinh tay nghề lẫn nhân phẩm, mang tiếng phá bảng hiệu, bán đứng đồng nghiệp',
      默默无闻: 'trong nghề chẳng ai biết tới người này',
      受人尊敬: 'đồng nghiệp nể trọng tài nghệ và đức hạnh, là nhân vật có tiếng trong nghề',
      万众敬仰: 'được tôn làm bậc tông sư một thời, đồng đạo xem là chuẩn mực',
    },
  };
  // 旧存档兼容：六级时期的"小有名气"归入"受人尊敬"
  const REP_LEGACY = { 小有名气: '受人尊敬' };

  // 势力运势判词：把运势词翻译成「这势力眼下什么处境、内部团不团结」
  const STATUS_VERDICT = {
    鼎盛: 'tiền lương dồi dào, nhân lực hùng hậu, trên dưới một lòng, vững như bàn thạch, hành sự đầy khí thế và uy phong không thể nghi ngờ',
    稳固: 'vận hành như thường, nền tảng vững chắc, không có nội ưu ngoại hoạn rõ rệt, tuần tự thúc đẩy các việc đã định',
    倾轧: 'bề ngoài còn chống đỡ, bên trong phe phái khuynh loát, hạt nhân bất hòa, nhiều quyết sách trì trệ vì nội đấu, tự trói tay nhau',
    困顿: 'tài nguyên cạn kiệt hoặc bị phong tỏa, đang gắng gượng chống chọi, đâu cũng thiếu trước hụt sau, không chịu nổi thêm một cú đánh',
    衰落: 'đã mất trụ cột, địa bàn hoặc nhân vật cốt lõi, lòng người dao động, thua lui từng bước, đang trượt dần tới tan rã',
    瓦解: 'hữu danh vô thực, chỉ còn cái vỏ rỗng, hiệu lệnh khó ra, bị phản bội ly tán, bất cứ lúc nào cũng có thể tan rã hoàn toàn',
  };

  // 势力关系判词：把关系词翻译成「这势力对{{user}}的行为倾向」
  const RELATION_VERDICT = {
    血盟: 'sống chết cùng {{user}}, tin tưởng tuyệt đối, sẵn sàng trợ giúp bằng mọi giá, xem an nguy của {{user}} như sự tồn vong của chính mình',
    盟友: 'ngang hàng với {{user}}, tương trợ lẫn nhau, chủ động chi viện và chia sẻ tin tức trên lợi ích chung, nhưng ai cũng có giới hạn riêng',
    友好: 'công nhận {{user}}, sẵn lòng ưu tiên hợp tác, tạo thuận lợi, tỏ thiện chí, nhưng chưa tới mức kết minh giao tâm',
    中立: 'với {{user}} không thân không sơ, mọi việc theo lợi hại của mình, không có lập trường định sẵn',
    冷淡: 'đã để ý {{user}} nhưng chẳng mấy hứng thú, giữ khoảng cách, không muốn thân, tạm chưa có ý định chủ động',
    敌对: 'công khai đối lập với {{user}}, sẽ gây áp lực, cản trở, làm khó ra mặt, thậm chí tìm cơ hội xung đột trực diện',
    世仇: 'không đội trời chung với {{user}}, quyết trừ cho bằng được, không từ thủ đoạn, liên tục rình sơ hở để hạ độc thủ',
  };

  // 经济气候判词：把单个气候词翻译成给正文模型看的市面描述
  const CLIMATE_VERDICT = {
    繁荣: 'phố chợ phồn thịnh, thương lộ thông suốt, trăm nghề hưng vượng, tiền hàng lưu thông trơn tru, vật giá ổn định mà hơi cao',
    平稳: 'phố chợ như thường, vật giá lên xuống tự nhiên theo mùa, không có biến động lớn',
    衰退: 'phố chợ tiêu điều, nhu cầu co lại, các hiệu buôn lần lượt đóng cửa, số ít hàng thiết yếu lại khan hiếm tăng giá',
    动荡: 'trật tự kinh tế bên bờ sụp đổ, vật giá mất kiểm soát, thương lộ tắc nghẽn, lòng người hoang mang, quay lại đổi chác hàng lấy hàng',
  };

  function buildContext(worldState, tags) {
    const rulesLoader = window.WORLD_ENGINE_RULES;
    const rulesSummary = rulesLoader ? rulesLoader.getCoreRulesSummary() : '';

    // 事件链：Lv3/4 全注入，Lv1/2 仅已爆发/已完成终局注入
    const visibleEvents = (worldState.events || []).filter(e => {
      if (e.level >= 3) return true;
      return e.stage === '已爆发' || e.stage === '已完成';
    });
    const eventsText = visibleEvents.map(e => {
      const typeName = e.type === 'progress' ? 'Thúc đẩy' : 'Xung đột';
      let txt = `${e.name}(${typeName}, Lv.${e.level}) ${L(e.stage)} ${e.stageRound||1}/9`;
      if (e.evolveResult) txt += ` [${L(e.evolveResult)}]`;
      return txt;
    }).join('；') || 'Không';

    // 势力：全部7级关系都注入，渲染成自然语句，运势/关系各带判词
    const formatPillars = (arr) => arr.length === 1
      ? arr[0]
      : arr.slice(0, -1).join('、') + ' và ' + arr[arr.length - 1];
    const allFactions = worldState.factions || [];
    const factionsText = allFactions.length
      ? '\n' + allFactions.map(f => {
          const statusDesc = STATUS_VERDICT[f.status] || (f.status ? `đang ở trạng thái「${L(f.status)}」` : 'tình cảnh không rõ');
          const relation = f.relation || '中立';
          const relationDesc = RELATION_VERDICT[relation] || `thái độ với {{user}} là「${L(relation)}」`;
          let s = `- ${f.name} hiện ${statusDesc}; thái độ với {{user}} là ${L(relation)} — ${relationDesc}.`;
          if (f.scope) s += ` Phạm vi thế lực trải khắp ${f.scope}.`;
          if (f.currentGoal) s += ` Hiện đang dốc sức vào ${f.currentGoal}.`;
          const tail = [];
          if (f.core_person) tail.push(`nhân vật cốt lõi là ${f.core_person}`);
          if (f.powerPillars?.length) tail.push(`nền tảng vận hành dựa vào ${formatPillars(f.powerPillars)}`);
          if (tail.length) s += ' ' + tail.join(', ') + '.';
          return s;
        }).join('\n')
      : 'Không';

    // 风声：只注入 Lv3/4
    const visibleWinds = (worldState.winds || []).filter(w => (w.level || 0) >= 3);
    const windsText = visibleWinds.map(w =>
      `[${L(({ announcement: '公告', report: '消息', rumor: '流言', sentiment: '舆情' })[w.type]) || 'Phong thanh'} Lv.${w.level || 1} ${w.scope || '?'}] ${w.content}`
    ).join('；') || 'Không';

    // 天下大势
    const trendsText = (worldState.worldTrends || []).filter(t => t.status !== '已结束').map(t =>
      `${t.name}（${t.scope || 'Thiên hạ'}）：${t.description}`
    ).join('；') || 'Không';

    // 声誉：注入人话判词，而非光秃秃的等级标签
    const rep = worldState.reputation || {};
    const repText = ['authority', 'common', 'shadow', 'circuit'].map(k => {
      const lv = REP_LEGACY[rep[k]] || rep[k];
      const verdict = REP_VERDICT[k] && REP_VERDICT[k][lv];
      if (!verdict) return '';
      return `Ở ${REP_DIM_NAME[k]} thuộc hạng ${L(lv)}, ${verdict}`;
    }).filter(Boolean).join('. ') + '.';
    const repChange = rep.lastChange ? `（${rep.lastChange}）` : '';

    // 经济信号：全注入
    const econ = worldState.economy || {};
    const signalsText = (econ.signals || []).map(s => `${s.summary}（${s.scope}）`).join('；');
    const climate = econ.climate || '平稳';
    const climateText = `Phố chợ ${L(climate)}, ${CLIMATE_VERDICT[climate] || CLIMATE_VERDICT['平稳']}`;
    const econText = `${climateText}${signalsText ? '. Tín hiệu: ' + signalsText : ''}`;

    // 仇敌录
    let enemiesText = 'Không';
    if (worldState.enemies && worldState.enemies.length) {
      enemiesText = worldState.enemies.map(e =>
        `${e.name}（${e.type==='blood'?'Huyết thù':'Ân oán'}, ${L(e.status)}, nguyên nhân: ${e.reason}）`
      ).join('；');
    }

    // 区域突发事件
    const ri = worldState.regionalIncident || {};
    let riText = '';
    if (ri.active) {
      riText = `⚠️ ${ri.title || 'Sự kiện đột phát khu vực'}（${ri.type || '?'}, ${ri.scope || '?'}）— ${ri.impact || ''}`;
    } else {
      riText = (ri._retry === true || (ri.title && ri.title.includes('thử lại'))) ? `⚠️ ${ri.title}` : 'Vòng này không có sự kiện đột phát khu vực';
    }

    // 信息黑盒：展示具体内容
    const blackbox = worldState.blackbox || {};
    const boxParts = [];
    if (blackbox.secretActions?.length) {
      const actionsText = blackbox.secretActions.map(a =>
        `[Hành vi] ${a.action || '?'}（chứng kiến: ${a.witnesses || 'không'}）`
      ).join('；');
      boxParts.push(`Hành vi ẩn giấu(${blackbox.secretActions.length}): ${actionsText}`);
    }
    if (blackbox.secretAssets?.length) {
      const assetsText = blackbox.secretAssets.map(a =>
        `[Tài sản] ${a.name || '?'}（bại lộ: ${a.exposure || 0}%, ${L(a.status || '有效')}）`
      ).join('；');
      boxParts.push(`Tài sản ẩn giấu(${blackbox.secretAssets.length}): ${assetsText}`);
    }
    const blackboxText = boxParts.length ? boxParts.join(' | ') : 'Không có thông tin mặt tối';

    const context = `
【Trạng thái thế giới】
Vòng: ${worldState.round}
Tóm tắt: ${worldState.worldDigest}
Đại thế thiên hạ: ${trendsText}
Chuỗi sự kiện: ${eventsText}
Thế lực: ${factionsText}
Tin đồn: ${windsText}
Thù địch: ${enemiesText}
Danh tiếng: ${repText}${repChange}
Kinh tế: ${econText}
Sự kiện khu vực: ${riText}
Hộp đen: ${blackboxText}

${rulesSummary}
    `.trim();

    return context.substring(0, 5000);
  }

  return { buildContext };
})();
