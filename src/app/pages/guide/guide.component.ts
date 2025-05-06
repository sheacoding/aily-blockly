import { Component } from '@angular/core';
import { GUIDE_MENU } from '../../configs/menu.config';
import { UiService } from '../../services/ui.service';
import { ProjectService } from '../../services/project.service';
import { version } from '../../../../package.json';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-guide',
  imports: [TranslateModule],
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.scss'
})
export class GuideComponent {
  version = version;
  guideMenu = GUIDE_MENU;
  showMenu = true;
  showMore = false;

  get recentlyProjects() {
    return this.projectService.recentlyProjects
  }

  constructor(
    private uiService: UiService,
    private projectService: ProjectService,
    private router: Router,
    private electronService: ElectronService
  ) { }

  onMenuClick(e: any) {
    this.process(e);
  }

  async selectFolder() {
    const folderPath = await window['ipcRenderer'].invoke('select-folder', {
      path: '',
    });
    console.log('选中的文件夹路径：', folderPath);
    return folderPath;
  }

  async openProject(data) {
    const path = await this.selectFolder();
    if (path) {
      await this.projectService.projectOpen(path);
    }
  }

  async openProjectByPath(data) {
    await this.projectService.projectOpen(data.path);
  }

  process(item) {
    switch (item.action) {
      case 'project-new':
        this.uiService.openWindow(item.data);
        break;
      case 'project-open':
        this.openProject(item.data);
        break;
      case 'browser-open':
        this.electronService.openUrl(item.data.url);
        break;
      case 'playground-open':
        this.router.navigate(['/main/playground']);
        break;
      default:
        break;
    }
  }

  openUrl(url: string) {
    this.electronService.openUrl(url);
  }

  gotoPlayground() {
    this.router.navigate(['/main/playground']);
  }
}
