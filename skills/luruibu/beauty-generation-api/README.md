# Beauty Generation API - Agent Skill

An AgentSkills bundle for generating high-quality AI portraits of beautiful women using the DiversityFaces Beauty Generation API.

## Overview

This skill enables AI agents to generate professional beauty portraits with extensive customization options including:

- **28+ Nationalities**: Comprehensive Asian, Southeast Asian, South Asian, and Central Asian representation
- **8 Beauty Styles**: From 清纯 (pure) to 冷艳 (cool elegance)  
- **Extensive Customization**: Clothing, scenes, moods, hairstyles, accessories
- **Professional Quality**: High-resolution outputs with safety filtering
- **Cultural Authenticity**: Culturally appropriate combinations and traditional clothing

## Quick Start

### For AI Agents

The skill provides comprehensive instructions for generating beauty portraits:

```markdown
Generate a professional Chinese businesswoman portrait:
- Use style="知性" (intellectual), age="25", nationality="中国"
- Set clothing="西装", scene="办公室", mood="自信"
```

### For Developers

Use the included Python script:

```bash
# Generate with preset
python3 scripts/generate.py --preset professional-chinese --out-dir ./output

# Generate with custom parameters  
python3 scripts/generate.py --standard \
  --style 古典 --age 23 --nationality 日本 \
  --clothing 和服 --scene 花园 --mood 温柔

# Random generation with overrides
python3 scripts/generate.py --random --clothing 旗袍 --nationality 中国
```

## Installation

### As NPM Package
```bash
npm install beauty-generation-api-skill
```

### As Agent Skill
1. Download the `beauty-generation-api-1.0.0` folder
2. Place in your agent's skills directory
3. The agent will automatically discover and load the skill

## API Authentication

Requires API key authentication:
- **API Key**: `ak_OymjErKQRs-brINJuHFxKwIbxbZHq2KRiEzYthnwxMI`
- **Base URL**: `https://gen1.diversityfaces.org`
- **Header**: `X-API-Key: {api_key}`

Set environment variable:
```bash
export BEAUTY_API_KEY=ak_OymjErKQRs-brINJuHFxKwIbxbZHq2KRiEzYthnwxMI
```

## Style Presets

The skill includes curated style presets for common use cases:

- **professional-chinese**: Business professional portrait
- **traditional-japanese**: Classical Japanese beauty in kimono
- **modern-korean**: Contemporary Korean fashion
- **elegant-chinese-qipao**: Traditional Chinese qipao elegance
- **casual-lifestyle**: Casual everyday beauty
- **fashion-editorial**: High-fashion editorial style

## Parameters Reference

### Beauty Styles (风格)
- `清纯` - Pure, innocent natural beauty
- `性感` - Elegant and alluring sophistication  
- `古典` - Classical traditional beauty
- `现代` - Modern contemporary style
- `甜美` - Sweet and cute charm
- `冷艳` - Cool, aloof elegance
- `知性` - Intellectual refinement
- `活泼` - Lively, energetic personality

### Clothing Options
- **Traditional**: 旗袍 (qipao), 和服 (kimono), 韩服 (hanbok), 中山装 (zhongshan suit)
- **Modern**: 连衣裙 (dress), 西装 (suit), 衬衫 (shirt), 毛衣 (sweater)
- **Casual**: 休闲装 (casual wear), 运动装 (sportswear), 牛仔裤 (jeans)
- **Formal**: 晚礼服 (evening gown), 正装 (formal wear)

### Scenes & Settings
- **Professional**: 办公室 (office), 会议室 (meeting room)
- **Cultural**: 花园 (garden), 古典园林 (classical garden)
- **Urban**: 城市 (city), 咖啡厅 (cafe), 商场 (mall)
- **Natural**: 户外 (outdoor), 海边 (seaside), 山顶 (mountaintop)

## Usage Examples

### Character Design
```python
# Generate anime-style character
client.generate_standard(
    style="甜美",
    age="20", 
    nationality="日本",
    clothing="校服",
    scene="学校",
    mood="活泼"
)
```

### Fashion Photography
```python
# Generate fashion model
client.generate_standard(
    style="冷艳",
    age="25",
    nationality="俄罗斯", 
    clothing="晚礼服",
    scene="城市",
    mood="神秘"
)
```

### Cultural Portraits
```python
# Generate traditional portrait
client.generate_standard(
    style="古典",
    age="24",
    nationality="中国",
    clothing="旗袍",
    scene="古典园林", 
    mood="优雅"
)
```

## Error Handling

The skill includes comprehensive error handling for:
- Authentication failures
- Parameter validation errors  
- Rate limiting
- Safety content filtering
- Network timeouts

## Safety & Ethics

- Built-in content safety filtering
- Culturally respectful representations
- Professional, appropriate imagery only
- No inappropriate or offensive content
- Diverse, inclusive beauty standards

## Contributing

This skill is part of the DiversityFaces project promoting inclusive AI-generated imagery. Contributions welcome for:
- Additional cultural representations
- New style presets
- Enhanced parameter combinations
- Documentation improvements

## License

MIT License - See LICENSE file for details.

## Support

- **Documentation**: See SKILL.md for complete API reference
- **Issues**: Report bugs or request features
- **API Status**: Check https://gen1.diversityfaces.org/health