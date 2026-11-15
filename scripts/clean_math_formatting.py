"""
Replace LaTeX math markup with clean HTML/Unicode typography across Ch3 and Ch4/Ch5 scripts.
"""

def clean_ch3():
    with open('scripts/report_content_ch3.py', 'r', encoding='utf-8') as f:
        text = f.read()

    # Table 3.8
    text = text.replace('$H \\times W \\times 3$', '<i>H</i> &times; <i>W</i> &times; 3')
    text = text.replace('$\\text{Crop}(H_{224}, W_{224})$', 'Crop(<i>H</i><sub>224</sub>, <i>W</i><sub>224</sub>)')
    text = text.replace('$224 \\times 224$ pixels', '224 &times; 224 pixels')
    text = text.replace('$224 \\times 224 \\times 3$', '224 &times; 224 &times; 3')
    text = text.replace('$x_{\\text{norm}} = x / 255.0$', '<i>x</i><sub>norm</sub> = <i>x</i> / 255.0')
    text = text.replace('$[0, 255] \\rightarrow [0.0, 1.0]$', '[0, 255] &rarr; [0.0, 1.0]')
    text = text.replace('$z_c = \\frac{x_c - \\mu_c}{\\sigma_c}$', '<i>z</i><sub><i>c</i></sub> = (<i>x</i><sub><i>c</i></sub> &minus; &mu;<sub><i>c</i></sub>) / &sigma;<sub><i>c</i></sub>')
    text = text.replace('$\\mu = [0.485, 0.456, 0.406]$<br>$\\sigma = [0.229, 0.224, 0.225]$', '&mu; = [0.485, 0.456, 0.406]<br>&sigma; = [0.229, 0.224, 0.225]')
    text = text.replace('$\\text{Permute}(H, W, C) \\rightarrow (C, H, W)$', 'Permute(<i>H</i>, <i>W</i>, <i>C</i>) &rarr; (<i>C</i>, <i>H</i>, <i>W</i>)')
    text = text.replace('$[1, 3, 224, 224]$', '[1, 3, 224, 224]')

    # Page 32 ML Methodology
    text = text.replace('$\\mathcal{X} \\subset \\mathbb{R}^{3 \\times 224 \\times 224}$', '<b>X</b> &sub; <b>R</b><sup>3&times;224&times;224</sup>')
    text = text.replace('$\\mathcal{Y} = \\{1, 2, \\dots, K\\}$', '<b>Y</b> = {1, 2, ..., <i>K</i>}')
    text = text.replace('$f_\\theta: \\mathcal{X} \\rightarrow \\Delta^{K-1}$', '<i>f</i><sub>&theta;</sub>: <b>X</b> &rarr; &Delta;<sup><i>K</i>&minus;1</sup>')
    text = text.replace('$\\hat{\\mathbf{y}} = [\\hat{y}_1, \\dots, \\hat{y}_K]^\\top$', '<b>y&#770;</b> = [<i>y&#770;</i><sub>1</sub>, ..., <i>y&#770;</i><sub><i>K</i></sub>]<sup>T</sup>')
    text = text.replace('$\\theta$', '&theta;')
    text = text.replace('($\\epsilon = 0.1$)', '(&epsilon; = 0.1)')
    text = text.replace('$$\\mathcal{L}_{\\text{CE}}(\\theta) = -\\sum_{i=1}^{K} \\left( (1-\\epsilon) y_i + \\frac{\\epsilon}{K} \\right) \\log f_\\theta(\\mathbf{x})_i$$',
                        '<i>L</i><sub>CE</sub>(&theta;) = &minus;&sum;<sub><i>i</i>=1</sub><sup><i>K</i></sup> [ (1 &minus; &epsilon;) <i>y</i><sub><i>i</i></sub> + (&epsilon; / <i>K</i>) ] &middot; ln(<i>f</i><sub>&theta;</sub>(<b>x</b>)<sub><i>i</i></sub>)')
    text = text.replace('($\\lambda = 10^{-4}$)', '(&lambda; = 10<sup>&minus;4</sup>)')
    text = text.replace('$\\eta_0 = 10^{-4}$', '&eta;<sub>0</sub> = 10<sup>&minus;4</sup>')
    text = text.replace('$\\beta_1 = 0.9, \\beta_2 = 0.999$', '&beta;<sub>1</sub> = 0.9, &beta;<sub>2</sub> = 0.999')
    text = text.replace('$$\\eta_t = \\eta_{\\text{min}} + \\frac{1}{2}(\\eta_0 - \\eta_{\\text{min}})\\left(1 + \\cos\\left(\\frac{t}{T_{\\text{max}}}\\pi\\right)\\right)$$',
                        '&eta;<sub><i>t</i></sub> = &eta;<sub>min</sub> + &frac12;(&eta;<sub>0</sub> &minus; &eta;<sub>min</sub>) [ 1 + cos(&pi;<i>t</i> / <i>T</i><sub>max</sub>) ]')

    # Page 34 & 35 Quality Gating
    text = text.replace('$I(x,y)$', '<i>I</i>(<i>x,y</i>)')
    text = text.replace('$$\\text{Var}_{\\text{Lap}} = \\frac{1}{HW} \\sum_{x,y} \\left( \\nabla^2 I(x,y) - \\mu_{\\text{Lap}} \\right)^2, \\quad \\nabla^2 I = \\frac{\\partial^2 I}{\\partial x^2} + \\frac{\\partial^2 I}{\\partial y^2}$$',
                        '<i>Var</i><sub>Lap</sub> = (1 / <i>HW</i>) &sum;<sub><i>x,y</i></sub> [ &nabla;<sup>2</sup><i>I</i>(<i>x,y</i>) &minus; &mu;<sub>Lap</sub> ]<sup>2</sup>, &nbsp;&nbsp; where &nabla;<sup>2</sup><i>I</i> = &part;<sup>2</sup><i>I</i>/&part;<i>x</i><sup>2</sup> + &part;<sup>2</sup><i>I</i>/&part;<i>y</i><sup>2</sup>')
    text = text.replace('$\\text{Var}_{\\text{Lap}} < 100.0$', '<i>Var</i><sub>Lap</sub> &lt; 100.0')
    text = text.replace('$\\bar{L} = \\frac{1}{HW}\\sum_{x,y} (0.299R + 0.587G + 0.114B)$', '<i>L&#772;</i> = (1 / <i>HW</i>) &sum; (0.299<i>R</i> + 0.587<i>G</i> + 0.114<i>B</i>)')
    text = text.replace('$\\hat{\\mathbf{y}}$', '<b>y&#770;</b>')
    text = text.replace('$$\\mathcal{H}(\\hat{\\mathbf{y}}) = -\\sum_{i=1}^{K} \\hat{y}_i \\log_2 \\hat{y}_i$$',
                        '<i>H</i>(<b>y&#770;</b>) = &minus;&sum;<sub><i>i</i>=1</sub><sup><i>K</i></sup> <i>y&#770;</i><sub><i>i</i></sub> &middot; log<sub>2</sub>(<i>y&#770;</i><sub><i>i</i></sub>)')
    text = text.replace('$p_{\\text{max}} = \\max_i(\\hat{y}_i) \\ge 0.60$', '<i>p</i><sub>max</sub> = max(<i>y&#770;</i><sub><i>i</i></sub>) &ge; 0.60')
    text = text.replace('$\\Delta p = \\hat{y}_{(1)} - \\hat{y}_{(2)} < 0.15$', '&Delta;<i>p</i> = <i>y&#770;</i><sub>(1)</sub> &minus; <i>y&#770;</i><sub>(2)</sub> &lt; 0.15')
    text = text.replace('$\\sigma^2_{\\nabla^2}$', '&sigma;<sup>2</sup><sub>&nabla;<sup>2</sup></sub>')
    text = text.replace('$\\ge 100.0$', '&ge; 100.0')
    text = text.replace('$\\bar{L} \\in [0, 255]$', '<i>L&#772;</i> &isin; [0, 255]')
    text = text.replace('$40.0 \\le \\bar{L} \\le 220.0$', '40.0 &le; <i>L&#772;</i> &le; 220.0')
    text = text.replace('$\\max(\\hat{y}_i)$', 'max(<i>y&#770;</i><sub><i>i</i></sub>)')
    text = text.replace('$\\ge 0.60$', '&ge; 0.60')
    text = text.replace('$\\hat{y}_{(1)} - \\hat{y}_{(2)}$', '<i>y&#770;</i><sub>(1)</sub> &minus; <i>y&#770;</i><sub>(2)</sub>')
    text = text.replace('$\\ge 0.15$', '&ge; 0.15')

    # MobileNet block text
    text = text.replace('$1 \\times 1$', '1 &times; 1')
    text = text.replace('$3 \\times 3$', '3 &times; 3')
    text = text.replace('$5 \\times 5$', '5 &times; 5')
    text = text.replace('$C_{\\text{in}}$', '<i>C</i><sub>in</sub>')
    text = text.replace('$C_{\\text{out}}$', '<i>C</i><sub>out</sub>')
    text = text.replace('$t=6$', '<i>t</i> = 6')
    text = text.replace('$t C_{\\text{in}}$', '<i>t</i> &middot; <i>C</i><sub>in</sub>')
    text = text.replace('$1 \\times 1 \\times C$', '1 &times; 1 &times; <i>C</i>')
    text = text.replace('$10^{-3}$', '10<sup>&minus;3</sup>')
    text = text.replace('$10^{-4}$', '10<sup>&minus;4</sup>')
    text = text.replace('$\\pm 25^\\circ$', '&plusmn;25&deg;')
    text = text.replace('$\\pm 20\\%$', '&plusmn;20%')
    text = text.replace('Linear(960, 10)', 'Linear(960 &rarr; 10)')
    text = text.replace('($\\epsilon=0.1$)', '(&epsilon; = 0.1)')
    text = text.replace('($\\beta_1=0.9, \\beta_2=0.999$)', '(&beta;<sub>1</sub> = 0.9, &beta;<sub>2</sub> = 0.999)')
    text = text.replace('$1 \\times 10^{-4}$', '1 &times; 10<sup>&minus;4</sup>')
    text = text.replace('$L_2$', '<i>L</i><sub>2</sub>')

    with open('scripts/report_content_ch3.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Cleaned math in report_content_ch3.py")

def clean_ch4_ch5():
    with open('scripts/report_content_ch4_ch5_appendices.py', 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace('($\\ge 100$)', '(&ge; 100)')
    text = text.replace('($[40, 220]$)', '([40, 220])')
    text = text.replace('($< 60\\%$ cautionary warning)', '(&lt; 60% cautionary warning)')
    text = text.replace('$\\text{Var}_{\\text{Lap}} = 34.2$', '<i>Var</i><sub>Lap</sub> = 34.2')
    text = text.replace('$\\text{Mean Luma} = 22.8$', 'Mean Luma = 22.8')
    text = text.replace('$\\text{Mean Luma} = 238.4$', 'Mean Luma = 238.4')
    text = text.replace('$\\text{Var}_{\\text{Lap}} = 285, \\text{Luma} = 124$', '<i>Var</i><sub>Lap</sub> = 285, Luma = 124')
    text = text.replace('$\\rightarrow$', '&rarr;')
    text = text.replace('$> 90\\%$', '&gt; 90%')

    with open('scripts/report_content_ch4_ch5_appendices.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Cleaned math in report_content_ch4_ch5_appendices.py")

if __name__ == '__main__':
    clean_ch3()
    clean_ch4_ch5()
