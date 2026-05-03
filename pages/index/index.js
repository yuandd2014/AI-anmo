Page({
  data: {
    // 状态: setup | ready | timing | result
    state: 'setup',

    // 设置参数
    pricePerMin: '',
    minMinutes: '',
    canStart: false,

    // 计时
    elapsedSeconds: 0,
    displayTime: '00:00',
    currentCost: 0,

    // 结果
    actualMinutes: 0,
    actualSeconds: 0,
    billingMinutes: 0,
    totalCost: 0,
    usedMinTime: false
  },

  timerId: null,
  tickCount: 0,

  // ===== 设置阶段 =====

  onPriceInput(e) {
    const val = e.detail.value
    this.setData({ pricePerMin: val })
    this._checkCanStart(val, this.data.minMinutes)
  },

  onMinInput(e) {
    const val = e.detail.value
    this.setData({ minMinutes: val })
    this._checkCanStart(this.data.pricePerMin, val)
  },

  _checkCanStart(price, min) {
    const p = parseFloat(price)
    const m = parseFloat(min)
    this.setData({
      canStart: p > 0 && m > 0
    })
  },

  onConfirmSetup() {
    const price = parseFloat(this.data.pricePerMin)
    const min = parseFloat(this.data.minMinutes)
    if (price <= 0 || min <= 0) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' })
      return
    }
    this.setData({ state: 'ready' })
  },

  onBackToSetup() {
    clearInterval(this.timerId)
    this.timerId = null
    this.tickCount = 0
    this.setData({
      state: 'setup',
      elapsedSeconds: 0,
      displayTime: '00:00',
      currentCost: 0
    })
  },

  // ===== 计时阶段 =====

  onStartTimer() {
    this.tickCount = 0
    this.setData({
      state: 'timing',
      elapsedSeconds: 0,
      displayTime: '00:00',
      currentCost: 0
    })

    this.timerId = setInterval(() => {
      this.tickCount++
      const seconds = this.tickCount
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      const display = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')

      // 计算当前费用：按实际秒数折算分钟，向上取整？还是按满分钟计？
      // 更合理：按已用分钟数（余秒按比例折算）
      const price = parseFloat(this.data.pricePerMin)
      const costMinutes = seconds / 60
      const cost = Math.round(costMinutes * price)

      this.setData({
        elapsedSeconds: seconds,
        displayTime: display,
        currentCost: cost
      })
    }, 1000)
  },

  onStopTimer() {
    clearInterval(this.timerId)
    this.timerId = null

    const price = parseFloat(this.data.pricePerMin)
    const minMinutes = parseFloat(this.data.minMinutes)
    const seconds = this.tickCount

    const actualMins = Math.floor(seconds / 60)
    const actualSecs = seconds % 60
    const actualDecimalMinutes = seconds / 60

    // 计费：取实际分钟数和最短分钟数中的较大值
    const billingMinutes = Math.max(actualDecimalMinutes, minMinutes)
    const totalCost = Math.round(billingMinutes * price)
    const usedMinTime = actualDecimalMinutes < minMinutes

    this.setData({
      state: 'result',
      actualMinutes: actualMins,
      actualSeconds: actualSecs,
      billingMinutes: billingMinutes,
      totalCost: totalCost,
      usedMinTime: usedMinTime
    })
  },

  // ===== 结果阶段 =====

  onRestart() {
    const price = this.data.pricePerMin
    const min = this.data.minMinutes
    this.setData({
      state: 'ready',
      elapsedSeconds: 0,
      displayTime: '00:00',
      currentCost: 0,
      pricePerMin: price,
      minMinutes: min
    })
  },

  onResetAll() {
    clearInterval(this.timerId)
    this.timerId = null
    this.tickCount = 0
    this.setData({
      state: 'setup',
      elapsedSeconds: 0,
      displayTime: '00:00',
      currentCost: 0,
      pricePerMin: '',
      minMinutes: ''
    })
  },

  onUnload() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }
})
