import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { SubWindowComponent } from '../../components/sub-window/sub-window.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import { ConfigService } from '../../services/config.service';
import { SimplebarAngularModule } from 'simplebar-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { validateProjectPath, PathValidationResult } from '../../func/func';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    SubWindowComponent,
    NzButtonModule,
    NzInputModule,
    NzRadioModule,
    SimplebarAngularModule,
    TranslateModule,
    NzSwitchModule,
    NzToolTipModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnDestroy {
  @ViewChild('scrollContainer', { static: false }) scrollContainer: ElementRef;

  activeSection = 'SETTINGS.SECTIONS.BASIC'; // 当前活动的部分

  // simplebar 配置选项
  options = {
    autoHide: true,
    scrollbarMinSize: 50
  };

  items = [
    {
      name: 'SETTINGS.SECTIONS.BASIC',
      icon: 'fa-light fa-gear'
    },
    {
      name: 'SETTINGS.SECTIONS.THEME',
      icon: 'fa-light fa-gift'
    },
    {
      name: 'SETTINGS.SECTIONS.COMPILATION',
      icon: 'fa-light fa-screwdriver-wrench'
    },
    {
      name: 'SETTINGS.SECTIONS.REPOSITORY',
      icon: 'fa-light fa-book-bookmark'
    },
    {
      name: 'SETTINGS.SECTIONS.DEPENDENCIES',
      icon: 'fa-light fa-layer-group'
    },
    {
      name: 'SETTINGS.SECTIONS.MCP',
      icon: 'fa-light fa-webhook'
    },
    {
      name: 'SETTINGS.SECTIONS.DEVMODE',
      icon: 'fa-light fa-gear-code'
    },
  ];

  // 用于跟踪安装/卸载状态
  boardOperations = {};

  get boardList() {
    return this.settingsService.boardList.concat(
      this.settingsService.toolList,
      this.settingsService.sdkList,
      this.settingsService.compilerList
    );;
  }

  get langList() {
    return this.translationService.languageList;
  }

  get currentLang() {
    return this.translationService.getSelectedLanguage();
  }

  get configData() {
    return this.configService.data;
  }

  appdata_path: string

  mcpServiceList = []


  // 自定义项目文件夹相关
  customProjectPath: string = '';
  pathValidationError: string = '';
  private resetTimer: any = null;

  constructor(
    private uiService: UiService,
    private settingsService: SettingsService,
    private translationService: TranslationService,
    private configService: ConfigService,
    private message: NzMessageService
  ) {
  }

  async ngOnInit() {
    await this.configService.init();
    // 初始化自定义项目路径
    this.customProjectPath = this.configData.customProjectPath || this.getDefaultProjectPath();
  }

  async ngAfterViewInit() {
    await this.updateBoardList();
  }

  async updateBoardList() {
    const platform = this.configService.data.platform;
    // this.appdata_path = this.configService.data.appdata_path[platform].replace('%HOMEPATH%', window['path'].getUserHome());
    this.appdata_path = window['path'].getAppData();
    // this.settingsService.getBoardList(this.appdata_path, this.configService.data.npm_registry[0]);
    this.settingsService.getToolList(this.appdata_path, this.configService.data.npm_registry[0]);
    this.settingsService.getSdkList(this.appdata_path, this.configService.data.npm_registry[0]);
    this.settingsService.getCompilerList(this.appdata_path, this.configService.data.npm_registry[0]);
  }

  selectLang(lang) {
    this.translationService.setLanguage(lang.code);
    window['ipcRenderer'].send('setting-changed', { action: 'language-changed', data: lang.code });
  }

  // 使用锚点滚动到指定部分
  scrollToSection(item) {
    this.activeSection = item.name;
    const element = document.getElementById(item.name);
    if (element && this.scrollContainer) {
      // 针对simplebar调整滚动方法
      const simplebarInstance = this.scrollContainer['SimpleBar'];
      if (simplebarInstance) {
        simplebarInstance.getScrollElement().scrollTo({
          top: element.offsetTop - 12,
          behavior: 'smooth'
        });
      }
    }
  }

  // 监听滚动事件以更新活动菜单项
  onScroll() {
    const sections = document.querySelectorAll('.section');
    let scrollElement;

    // 获取simplebar的滚动元素
    const simplebarInstance = this.scrollContainer['SimpleBar'];
    if (simplebarInstance) {
      scrollElement = simplebarInstance.getScrollElement();
    } else {
      return;
    }

    const scrollPosition = scrollElement.scrollTop;

    sections.forEach((section: HTMLElement) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop - 50 &&
        scrollPosition < sectionTop + sectionHeight - 50) {
        this.activeSection = section.id.replace('section-', '');
      }
    });
  }

  cancel() {
    this.uiService.closeWindow();
  }

  apply() {
    // 保存到config.json，如有需要立即加载的，再加载
    this.configService.save();
     window['ipcRenderer'].send('setting-changed', { action: 'devmode-changed', data: this.configData.devmode });
    // 保存完毕后关闭窗口
    this.uiService.closeWindow();
  }

  async uninstall(board) {
    this.boardOperations[board.name] = { status: 'loading' };
    const result = await this.settingsService.uninstall(board)
    if (result === 'success') {
      this.updateBoardList();
    }
    else if (result === 'failed') {
      this.boardOperations[board.name] = { status: 'failed' };
    }
  }

  async install(board) {
    this.boardOperations[board.name] = { status: 'loading' };
    const result = await this.settingsService.install(board)
    if (result === 'success') {
      this.updateBoardList();
    }
    else if (result === 'failed') {
      this.boardOperations[board.name] = { status: 'failed' };
    }
  }

  onDevModeChange() {
    // this.configData.devmode = this.configData.devmode;
  }

  // 获取默认项目路径
  getDefaultProjectPath(): string {
    const { pt } = (window as any)['electronAPI'].platform;
    return window['path'].getUserDocuments() + `${pt}aily-project`;
  }

  // 选择自定义项目文件夹
  async selectCustomProjectFolder() {
    try {
      const folderPath = await window['ipcRenderer'].invoke('select-folder', {
        path: this.customProjectPath,
      });
      
      if (folderPath) {
        const validation = validateProjectPath(folderPath);
        if (validation.isValid) {
          this.customProjectPath = folderPath;
          this.pathValidationError = '';
          this.clearResetTimer(); // 清除之前的定时器
        } else {
          this.message.error(validation.errorMessage || '路径无效');
          // 设置定时器，在错误提示消失后自动重置为默认路径
          this.scheduleAutoReset();
        }
      }
    } catch (error) {
      console.error('选择文件夹失败:', error);
      this.message.error('选择文件夹失败');
      // 选择失败也触发自动重置
      this.scheduleAutoReset();
    }
  }

  // 验证自定义路径
  validateCustomPath() {
    if (!this.customProjectPath) {
      this.pathValidationError = '';
      this.clearResetTimer();
      return;
    }

    const validation = validateProjectPath(this.customProjectPath);
    if (!validation.isValid) {
      this.pathValidationError = validation.errorMessage || '';
      // 手动输入无效路径时也触发自动重置
      this.scheduleAutoReset();
    } else {
      this.pathValidationError = '';
      this.clearResetTimer(); // 路径有效时清除定时器
    }
  }

  // 重置为默认路径
  resetToDefaultPath() {
    this.customProjectPath = this.getDefaultProjectPath();
    this.pathValidationError = '';
    this.clearResetTimer();
  }

  // 应用设置时保存自定义路径
  applyWithPathValidation() {
    // 先验证路径
    this.validateCustomPath();
    
    if (this.pathValidationError) {
      this.message.error('请修复路径错误后再保存设置');
      return;
    }

    // 检查路径是否存在，如果不存在则创建
    if (this.customProjectPath && !window['path'].isExists(this.customProjectPath)) {
      try {
        window['fs'].mkdirSync(this.customProjectPath, { recursive: true });
        this.message.success('已创建项目文件夹: ' + this.customProjectPath);
      } catch (error) {
        console.error('创建文件夹失败:', error);
        this.message.error('无法创建项目文件夹，请检查路径权限');
        return;
      }
    }

    // 保存自定义路径到配置
    this.configData.customProjectPath = this.customProjectPath;
    
    // 调用原有的保存逻辑
    this.apply();
  }

  // 计划自动重置 - 在错误提示显示3秒后自动重置为默认路径
  private scheduleAutoReset() {
    this.clearResetTimer(); // 先清除之前的定时器
    
    this.resetTimer = setTimeout(() => {
      this.customProjectPath = this.getDefaultProjectPath();
      this.pathValidationError = ''; // 确保清除所有错误状态
      // 显示重置提示
      this.message.info('已自动重置为默认项目路径', { nzDuration: 2000 });
    }, 3000); // 3秒后自动重置
  }

  // 清除重置定时器
  private clearResetTimer() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  // 组件销毁时清理定时器
  ngOnDestroy() {
    this.clearResetTimer();
  }
}
