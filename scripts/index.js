const RESOLUTIONS = [
    { id: '1920x1080', name: 'Full HD (1920x1080)', width: 1920, height: 1080, device: 'pc' },
    { id: '2560x1440', name: '2K (2560x1440)', width: 2560, height: 1440, device: 'pc' },
    { id: '3840x2160', name: '4K (3840x2160)', width: 3840, height: 2160, device: 'pc' },
    { id: '1080x1920', name: 'Phone Full HD (1080x1920)', width: 1080, height: 1920, device: 'phone' },
    { id: '1440x2560', name: 'Phone 2K (1440x2560)', width: 1440, height: 2560, device: 'phone' }
];

let state = {
    deviceType: 'pc',
    resolution: '1920x1080',
    colorPrimary: '#471717',
    colorSecondary: '#170b0b',
    colorExtra: '#f3d6ff',
    val1: 1.5,
    val2: 1.2,
    seed: Math.random() * 1000000
};

function createRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

function mixColors(c1, c2, r) {
    const r1 = hexToRgb(c1), r2 = hexToRgb(c2);
    return `rgb(${Math.round(r1.r * (1 - r) + r2.r * r)}, ${Math.round(r1.g * (1 - r) + r2.g * r)}, ${Math.round(r1.b * (1 - r) + r2.b * r)})`;
}

const Renderer = {
    render(ctx, s) {
        const { width, height } = ctx.canvas;
        const rand = createRandom(s.seed);
        ctx.clearRect(0, 0, width, height);

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, s.colorSecondary);
        sky.addColorStop(0.7, mixColors(s.colorSecondary, s.colorPrimary, 0.5));
        sky.addColorStop(1, s.colorPrimary);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = s.colorExtra;
        for (let i = 0; i < 300; i++) {
            const x = rand() * width, y = rand() * height * 0.8;
            const size = rand() * s.val1;
            ctx.globalAlpha = 0.2 + rand() * 0.8;
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        const layers = [
            { baseY: 0.82, opacity: 0.3, mix: 0.4, scale: 0.4 },
            { baseY: 0.90, opacity: 0.6, mix: 0.7, scale: 0.6 },
            { baseY: 1.05, opacity: 1.0, mix: 1.0, scale: 0.85 }
        ];

        layers.forEach(l => {
            const baseY = height * (l.baseY - (s.val2 * 0.1));
            const color = l.mix === 1 ? '#000000' : mixColors(s.colorSecondary, '#000000', l.mix);
            ctx.save();
            ctx.globalAlpha = l.opacity;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, height);
            const freq = width * 0.6;
            const sd = rand() * 10000;
            for (let x = 0; x <= width; x += 5) {
                const y = baseY + 
                    Math.sin(x / freq + sd) * (l.scale * s.val2 * 140) +
                    Math.sin(x / (freq * 0.35) + sd + 15) * (l.scale * s.val2 * 45);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.fill();
            ctx.restore();
        });
    }
};

const UI = {
    init() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.bind();
        this.updateRes();
        this.render();
    },
    bind() {
        document.getElementById('btn-pc').onclick = () => this.setDev('pc');
        document.getElementById('btn-phone').onclick = () => this.setDev('phone');
        document.getElementById('select-resolution').onchange = (e) => { state.resolution = e.target.value; this.render(); };
        ['primary', 'secondary', 'extra'].forEach(id => {
            document.getElementById(`color-${id}`).oninput = (e) => { state[`color${id.charAt(0).toUpperCase() + id.slice(1)}`] = e.target.value; this.render(); };
        });
        document.getElementById('slider-1').oninput = (e) => {
            state.val1 = parseFloat(e.target.value);
            document.getElementById('val-1').innerText = `${Math.round(state.val1 * 33)}%`;
            this.render();
        };
        document.getElementById('slider-2').oninput = (e) => {
            state.val2 = parseFloat(e.target.value);
            document.getElementById('val-2').innerText = `${Math.round(state.val2 * 50)}%`;
            this.render();
        };
        document.getElementById('btn-regenerate').onclick = () => { state.seed = Math.random() * 1000000; this.render(); };
        document.getElementById('btn-download').onclick = () => {
            const link = document.createElement('a');
            link.download = `nightgen-${Date.now()}.png`;
            link.href = this.canvas.toDataURL('image/png');
            link.click();
        };
    },
    setDev(type) {
        state.deviceType = type;
        state.resolution = type === 'pc' ? '1920x1080' : '1080x1920';
        document.getElementById('btn-pc').classList.toggle('active', type === 'pc');
        document.getElementById('btn-phone').classList.toggle('active', type === 'phone');
        this.updateRes();
        this.render();
    },
    updateRes() {
        const sel = document.getElementById('select-resolution');
        sel.innerHTML = '';
        RESOLUTIONS.filter(r => r.device === state.deviceType).forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id; opt.innerText = r.name; opt.selected = r.id === state.resolution;
            sel.appendChild(opt);
        });
    },
    render() {
        const res = RESOLUTIONS.find(r => r.id === state.resolution);
        this.canvas.width = res.width; this.canvas.height = res.height;
        Renderer.render(this.ctx, state);
    }
};

window.onload = () => UI.init();